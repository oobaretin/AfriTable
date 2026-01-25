-- Tighten reservation rules (advance window, same-day cutoff, "not accepting reservations")

create or replace function public.create_reservation(
  p_restaurant_id uuid,
  p_reservation_date date,
  p_reservation_time time,
  p_party_size int,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_special_requests text default null,
  p_occasion text default null,
  p_user_id uuid default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings record;
  v_open record;
  v_slot_minutes int;
  v_max_party int;
  v_advance_days int;
  v_cutoff_hours int;
  v_eligible_tables int;
  v_reserved int;
  v_start time := p_reservation_time;
  v_end time;
  v_inserted public.reservations;
  v_lock_key bigint;
  v_now timestamptz := now();
  v_req_ts timestamptz;
begin
  if p_party_size is null or p_party_size <= 0 then
    raise exception 'invalid_party_size';
  end if;

  -- lock per restaurant+date+time to serialize concurrent bookings
  v_lock_key := hashtext(p_restaurant_id::text || ':' || p_reservation_date::text || ':' || p_reservation_time::text);
  perform pg_advisory_xact_lock(v_lock_key);

  select
    slot_duration_minutes,
    max_party_size,
    advance_booking_days,
    same_day_cutoff_hours,
    operating_hours
  into v_settings
  from public.availability_settings
  where restaurant_id = p_restaurant_id;

  if v_settings is null then
    raise exception 'restaurant_not_accepting_reservations';
  end if;

  v_slot_minutes := coalesce(v_settings.slot_duration_minutes, 90);
  v_max_party := coalesce(v_settings.max_party_size, 20);
  v_advance_days := coalesce(v_settings.advance_booking_days, 30);
  v_cutoff_hours := coalesce(v_settings.same_day_cutoff_hours, 2);

  if p_party_size > v_max_party then
    raise exception 'party_size_exceeds_limit';
  end if;

  if p_reservation_date < (v_now::date) then
    raise exception 'past_date';
  end if;

  if p_reservation_date > (v_now::date + v_advance_days) then
    raise exception 'outside_advance_window';
  end if;

  -- same day cutoff
  v_req_ts := (p_reservation_date::timestamptz + p_reservation_time);
  if p_reservation_date = (v_now::date) and v_req_ts < (v_now + make_interval(hours => v_cutoff_hours)) then
    raise exception 'within_same_day_cutoff';
  end if;

  -- Verify restaurant is active
  if not exists (select 1 from public.restaurants r where r.id = p_restaurant_id and r.is_active = true) then
    raise exception 'restaurant_not_found';
  end if;

  -- Verify requested time is within operating hours for day-of-week
  select
    (x->>'open_time')::time as open_time,
    (x->>'close_time')::time as close_time
  into v_open
  from jsonb_array_elements(coalesce(v_settings.operating_hours, '[]'::jsonb)) x
  where (x->>'day_of_week')::int = extract(dow from p_reservation_date)::int
  limit 1;

  if v_open.open_time is null or v_open.close_time is null then
    raise exception 'closed_on_selected_day';
  end if;

  v_end := (v_start + make_interval(mins => v_slot_minutes))::time;
  if v_start < v_open.open_time or v_end > v_open.close_time then
    raise exception 'outside_operating_hours';
  end if;

  select count(*)
  into v_eligible_tables
  from public.restaurant_tables t
  where t.restaurant_id = p_restaurant_id
    and t.is_active = true
    and t.capacity >= p_party_size;

  if v_eligible_tables <= 0 then
    raise exception 'no_table_for_party_size';
  end if;

  select count(*)
  into v_reserved
  from public.reservations res
  where res.restaurant_id = p_restaurant_id
    and res.reservation_date = p_reservation_date
    and res.status in ('pending','confirmed','seated')
    and res.reservation_time < v_end
    and (res.reservation_time + make_interval(mins => v_slot_minutes))::time > v_start;

  if (v_eligible_tables - v_reserved) <= 0 then
    raise exception 'no_availability';
  end if;

  insert into public.reservations (
    restaurant_id,
    user_id,
    reservation_date,
    reservation_time,
    party_size,
    status,
    special_requests,
    occasion,
    guest_name,
    guest_email,
    guest_phone
  )
  values (
    p_restaurant_id,
    p_user_id,
    p_reservation_date,
    p_reservation_time,
    p_party_size,
    'confirmed',
    nullif(p_special_requests, ''),
    nullif(p_occasion, ''),
    nullif(p_guest_name, ''),
    nullif(p_guest_email, ''),
    nullif(p_guest_phone, '')
  )
  returning * into v_inserted;

  return v_inserted;
end;
$$;

