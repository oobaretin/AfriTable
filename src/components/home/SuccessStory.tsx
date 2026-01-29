"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

export function SuccessStory() {
  const [bookingGrowth, setBookingGrowth] = React.useState(0);
  const [rating, setRating] = React.useState(0);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  React.useEffect(() => {
    if (!hasAnimated) return;
    
    // Animate booking growth from 0 to 35
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = 35 / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const newValue = Math.min(increment * currentStep, 35);
      setBookingGrowth(Math.round(newValue));
      
      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    // Animate rating from 0 to 4.9
    let ratingStep = 0;
    const ratingInterval = setInterval(() => {
      ratingStep++;
      const newRating = Math.min((4.9 / steps) * ratingStep, 4.9);
      setRating(Number(newRating.toFixed(1)));
      
      if (ratingStep >= steps) {
        clearInterval(ratingInterval);
      }
    }, stepDuration);

    return () => {
      clearInterval(interval);
      clearInterval(ratingInterval);
    };
  }, [hasAnimated]);

  return (
    <section className="py-24 px-6 bg-brand-dark overflow-hidden rounded-[3rem] mx-4 my-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16" ref={ref}>
          
          {/* Visual Side: The Owner/Chef */}
          <div className="relative flex-1">
            <div className="absolute -top-6 -left-6 w-32 h-32 border-t-4 border-l-4 border-brand-ochre rounded-tl-[3rem] opacity-50"></div>
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl rotate-2 transition-transform hover:rotate-0 duration-500">
              {/* Replace with a real photo of a partner chef in their kitchen */}
              <div className="relative w-full aspect-[600/700]">
                <Image
                  src="/api/placeholder/600/700"
                  alt="Chef Partner"
                  fill
                  className="object-cover scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <p className="text-white font-black text-2xl tracking-tighter uppercase">Chef Amara</p>
                  <p className="text-brand-ochre font-bold text-sm uppercase tracking-widest">The Jollof Collective • Houston, TX</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text Side: The Story */}
          <div className="flex-1">
            <div className="mb-8">
               <span className="text-brand-ochre text-6xl font-serif">&quot;</span>
               <h3 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
                 AfriTable didn&apos;t just give us a booking system; they gave us a <span className="text-brand-forest">community</span> that actually understands our culture.
               </h3>
               <p className="text-lg text-slate-400 leading-relaxed mb-8">
                 &quot;Before joining the AfriTable pilot, we struggled to find a platform that respected the nuance of our service. Their team understood that African dining is about more than just a table—it&apos;s an experience. In just three months, our weekend bookings increased by 35%.&quot;
               </p>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8 mb-10">
              <div>
                <p className="text-3xl font-black text-white">
                  {bookingGrowth > 0 ? `+${bookingGrowth}%` : "+0%"}
                </p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Booking Growth</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">
                  {rating > 0 ? `${rating}/5` : "0/5"}
                </p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Diner Rating</p>
              </div>
            </div>

            <Link 
              href="/join-as-restaurant"
              className="inline-block btn-bronze px-10 py-4 rounded-2xl text-white font-bold tracking-widest uppercase text-sm shadow-xl shadow-brand-ochre/5 hover:shadow-brand-ochre/10 transition-shadow"
            >
              Partner with us
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
