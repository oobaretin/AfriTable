"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Reservation = {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  special_requests: string | null;
  occasion: string | null;
  internal_note?: string | null;
  assigned_table_id?: string | null;
};

type ReservationsResp = {
  restaurantId: string;
  day: string;
  stats: { total: number; completed: number; noShows: number; upcoming: number; covers: number };
  reservations: Reservation[];
};

async function patchReservation(id: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/dashboard/reservations/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || "Update failed");
  return data;
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "confirmed"
      ? "secondary"
      : status === "seated"
        ? "default"
        : status === "completed"
          ? "outline"
          : status === "no_show"
            ? "destructive"
            : "secondary";
  return <Badge variant={variant as any}>{status.replace("_", " ")}</Badge>;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export function OwnerDashboard({ restaurantName }: { restaurantName: string }) {
  const [selectedDate, setSelectedDate] = React.useState(() => format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const q = useQuery<ReservationsResp>({
    queryKey: ["ownerReservations", selectedDate, statusFilter],
    queryFn: async () => {
      const res = await fetch(
        `/api/dashboard/reservations?date=${encodeURIComponent(selectedDate)}&status=${encodeURIComponent(statusFilter)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load reservations");
      return data as ReservationsResp;
    },
    refetchInterval: 30_000,
  });

  const rows = React.useMemo(() => q.data?.reservations ?? [], [q.data?.reservations]);

  // timeline buckets by hour
  const buckets = React.useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of rows) {
      const hh = String(r.reservation_time).slice(0, 2);
      const key = `${hh}:00`;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const [details, setDetails] = React.useState<Reservation | null>(null);
  const [noteDraft, setNoteDraft] = React.useState<string>("");

  async function updateStatus(id: string, status: string) {
    await patchReservation(id, { status });
    toast.success("Reservation updated");
    void q.refetch();
  }

  async function saveNote(id: string) {
    await patchReservation(id, { internal_note: noteDraft });
    toast.success("Note saved");
    void q.refetch();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10 md:py-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Managing: <span className="font-medium text-foreground">{restaurantName}</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[170px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="seated">Seated</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="no_show">No-show</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void q.refetch()} disabled={q.isFetching}>
            Refresh
          </Button>
          <Button disabled title="Walk-ins are coming next">
            Add Walk-in
          </Button>
        </div>
      </div>

      <Tabs defaultValue="today">
        <TabsList className="flex w-full flex-wrap justify-start gap-2">
          <TabsTrigger value="today">Today&apos;s Reservations</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="all">All Reservations</TabsTrigger>
          <TabsTrigger value="tables">Table Management</TabsTrigger>
          <TabsTrigger value="settings">Availability Settings</TabsTrigger>
          <TabsTrigger value="profile">Restaurant Profile</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6 grid gap-6">
          {q.isLoading ? (
            <div className="grid gap-4 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[92px]" />
              ))}
            </div>
          ) : q.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t load reservations</AlertTitle>
              <AlertDescription>{String((q.error as any)?.message ?? "")}</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-5">
              <StatCard label="Total today" value={q.data?.stats.total ?? 0} />
              <StatCard label="Completed" value={q.data?.stats.completed ?? 0} />
              <StatCard label="No-shows" value={q.data?.stats.noShows ?? 0} />
              <StatCard label="Upcoming" value={q.data?.stats.upcoming ?? 0} />
              <StatCard label="Total covers" value={q.data?.stats.covers ?? 0} />
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Reservations grouped by hour (MVP).</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {q.isLoading ? (
                <Skeleton className="h-24" />
              ) : !buckets.length ? (
                <p className="text-sm text-muted-foreground">No reservations for this date.</p>
              ) : (
                <div className="grid gap-3">
                  {buckets.map(([hour, list]) => (
                    <div key={hour} className="grid gap-2">
                      <div className="text-xs font-medium text-muted-foreground">{hour}</div>
                      <div className="flex flex-wrap gap-2">
                        {list.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            className="rounded-lg border bg-muted/20 px-3 py-2 text-left text-sm hover:bg-muted/30"
                            onClick={() => {
                              setDetails(r);
                              setNoteDraft(r.internal_note ?? "");
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{String(r.reservation_time).slice(0, 5)}</span>
                              <StatusBadge status={r.status} />
                            </div>
                            <div className="mt-1 text-muted-foreground">
                              {r.guest_name ?? "Guest"} • Party {r.party_size}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reservation list</CardTitle>
              <CardDescription>Sortable table + actions (MVP).</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : rows.length ? (
                    rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{String(r.reservation_time).slice(0, 5)}</TableCell>
                        <TableCell>{r.guest_name ?? "Guest"}</TableCell>
                        <TableCell>
                          {r.guest_phone ? (
                            <a className="underline underline-offset-4" href={`tel:${r.guest_phone}`}>
                              {r.guest_phone}
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{r.party_size}</TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell>{r.special_requests ? "📝" : "—"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => void updateStatus(r.id, "seated")}>
                                Mark as Seated
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void updateStatus(r.id, "completed")}>
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void updateStatus(r.id, "no_show")}>
                                Mark as No-show
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDetails(r);
                                  setNoteDraft(r.internal_note ?? "");
                                }}
                              >
                                View / Add Note
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void updateStatus(r.id, "cancelled")}>
                                Cancel Reservation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground">
                        No reservations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={Boolean(details)} onOpenChange={(o) => !o && setDetails(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Reservation details</DialogTitle>
              </DialogHeader>
              {details ? (
                <div className="grid gap-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={details.status} />
                    <Badge variant="outline">{String(details.reservation_time).slice(0, 5)}</Badge>
                    <Badge variant="outline">Party {details.party_size}</Badge>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="font-medium">{details.guest_name ?? "Guest"}</div>
                    <div className="text-muted-foreground">{details.guest_email ?? "—"}</div>
                    <div className="text-muted-foreground">{details.guest_phone ?? "—"}</div>
                  </div>
                  {details.special_requests ? (
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="text-xs font-medium text-muted-foreground">Special requests</div>
                      <div className="mt-1">{details.special_requests}</div>
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    <div className="text-xs font-medium text-muted-foreground">Internal note</div>
                    <Textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
                  </div>
                </div>
              ) : null}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetails(null);
                  }}
                >
                  Close
                </Button>
                {details ? (
                  <Button
                    onClick={() =>
                      void saveNote(details.id).catch((e) => toast.error(String((e as any)?.message ?? "Failed")))
                    }
                  >
                    Save note
                  </Button>
                ) : null}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* MVP placeholders (next iterations) */}
        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar view</CardTitle>
              <CardDescription>Month/week/day views + density badges (next).</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              We’ll add a date picker with per-day counts and a list for the selected day.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All reservations</CardTitle>
              <CardDescription>Filters + pagination + export (next).</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              We’ll add range filters, search, bulk actions, and CSV export.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tables" className="mt-6">
          <TablesTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics (MVP)</CardTitle>
              <CardDescription>Simple summaries first, then charts.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Next: last-30-days totals, completion/no-show rates, and basic trend charts.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TablesTab() {
  const tables = useQuery({
    queryKey: ["ownerTables"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/tables");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      return data as { tables: any[] };
    },
  });

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [tableNumber, setTableNumber] = React.useState("");
  const [capacity, setCapacity] = React.useState("2");
  const [active, setActive] = React.useState(true);

  function reset() {
    setEditing(null);
    setTableNumber("");
    setCapacity("2");
    setActive(true);
  }

  async function save() {
    const payload = { table_number: tableNumber, capacity: Number(capacity), is_active: active };
    const res = await fetch(editing ? `/api/dashboard/tables/${editing.id}` : "/api/dashboard/tables", {
      method: editing ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Save failed");
    toast.success(editing ? "Table updated" : "Table added");
    setOpen(false);
    reset();
    void tables.refetch();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/dashboard/tables/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    toast.success("Table deleted");
    void tables.refetch();
  }

  return (
    <Card>
      <CardHeader className="md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Table management</CardTitle>
          <CardDescription>Add and manage table inventory (MVP).</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(o) => (setOpen(o), !o && reset())}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>Add new table</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit table" : "Add table"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <div className="text-sm font-medium">Table number</div>
                <Input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="e.g. T1" />
              </div>
              <div className="grid gap-1.5">
                <div className="text-sm font-medium">Capacity</div>
                <Select value={capacity} onValueChange={setCapacity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => String(i + 1)).map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-3">
                <div>
                  <div className="text-sm font-medium">Active</div>
                  <div className="text-xs text-muted-foreground">Inactive tables won’t be used for availability.</div>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void save().catch((e) => toast.error(String((e as any)?.message ?? "Failed")))}
                disabled={!tableNumber.trim()}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : (tables.data?.tables?.length ?? 0) ? (
              tables.data!.tables.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.table_number}</TableCell>
                  <TableCell>{t.capacity}</TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? "secondary" : "outline"}>{t.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(t);
                            setTableNumber(t.table_number);
                            setCapacity(String(t.capacity));
                            setActive(Boolean(t.is_active));
                            setOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => void remove(t.id).catch((e) => toast.error(String((e as any)?.message ?? "Failed")))}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No tables yet. Add your first table to enable availability.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SettingsTab() {
  const q = useQuery({
    queryKey: ["ownerSettings"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      return data as { settings: any };
    },
  });

  const [saving, setSaving] = React.useState(false);
  const [enabled, setEnabled] = React.useState(true);
  const [slot, setSlot] = React.useState("90");
  const [advance, setAdvance] = React.useState("30");
  const [cutoff, setCutoff] = React.useState("2");
  const [maxParty, setMaxParty] = React.useState("20");
  const [buffer, setBuffer] = React.useState("0");

  React.useEffect(() => {
    const s = q.data?.settings;
    if (!s) return;
    setEnabled(Boolean(s.online_reservations_enabled ?? true));
    setSlot(String(s.slot_duration_minutes ?? 90));
    setAdvance(String(s.advance_booking_days ?? 30));
    setCutoff(String(s.same_day_cutoff_hours ?? 2));
    setMaxParty(String(s.max_party_size ?? 20));
    setBuffer(String(s.buffer_minutes ?? 0));
  }, [q.data]);

  async function save() {
    setSaving(true);
    try {
      const payload = {
        online_reservations_enabled: enabled,
        slot_duration_minutes: Number(slot),
        advance_booking_days: Number(advance),
        same_day_cutoff_hours: Number(cutoff),
        max_party_size: Number(maxParty),
        buffer_minutes: Number(buffer),
      };
      const res = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || data?.error || "Save failed");
      toast.success("Settings saved");
      void q.refetch();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability settings</CardTitle>
        <CardDescription>Core reservation rules (MVP).</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between rounded-xl border bg-muted/10 p-4">
          <div>
            <div className="text-sm font-medium">Online reservations</div>
            <div className="text-xs text-muted-foreground">Turn off to stop accepting online bookings.</div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Slot duration (mins)" value={slot} onChange={setSlot} />
          <Field label="Advance booking days" value={advance} onChange={setAdvance} />
          <Field label="Same-day cutoff (hrs)" value={cutoff} onChange={setCutoff} />
          <Field label="Max party size" value={maxParty} onChange={setMaxParty} />
          <Field label="Buffer minutes" value={buffer} onChange={setBuffer} />
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Operating hours editor + holiday blocks are next (schema supports blocks via <code className="font-mono">reservation_blocks</code>).
        </p>
      </CardContent>
    </Card>
  );
}

function ProfileTab() {
  const q = useQuery({
    queryKey: ["ownerProfile"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      return data as { restaurant: any };
    },
  });

  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [price, setPrice] = React.useState("2");
  const [description, setDescription] = React.useState("");

  React.useEffect(() => {
    const r = q.data?.restaurant;
    if (!r) return;
    setName(r.name ?? "");
    setPhone(r.phone ?? "");
    setPrice(String(r.price_range ?? 2));
    setDescription(r.description ?? "");
  }, [q.data]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          price_range: Number(price),
          description,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || data?.error || "Save failed");
      toast.success("Profile saved");
      void q.refetch();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restaurant profile</CardTitle>
        <CardDescription>Basic info (MVP).</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <div className="text-sm font-medium">Restaurant name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <div className="text-sm font-medium">Phone</div>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <div className="text-sm font-medium">Price range</div>
            <Select value={price} onValueChange={setPrice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">$</SelectItem>
                <SelectItem value="2">$$</SelectItem>
                <SelectItem value="3">$$$</SelectItem>
                <SelectItem value="4">$$$$</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-1.5">
          <div className="text-sm font-medium">Description</div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24" />
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Photo uploads + menu management will be added next (Supabase Storage).
        </p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <div className="text-sm font-medium">{label}</div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} inputMode="numeric" />
    </div>
  );
}

