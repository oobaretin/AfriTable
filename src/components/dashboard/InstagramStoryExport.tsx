"use client";

import * as React from "react";
import Image from "next/image";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Stamp = {
  id: string;
  restaurant: string;
  restaurantSlug?: string;
  city: string;
  date: string;
  color: string;
  cuisine?: string;
};

type User = {
  name: string;
};

type InstagramStoryExportProps = {
  user: User;
  stamps: Stamp[];
  rank: string;
};

export function InstagramStoryExport({ user, stamps, rank }: InstagramStoryExportProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const storyRef = React.useRef<HTMLDivElement>(null);

  async function handleDownload() {
    if (!storyRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(storyRef.current, {
        quality: 1.0,
        pixelRatio: 3, // High resolution for Instagram
        backgroundColor: "#1A1A1B", // brand-dark
        width: 1080, // Instagram story width
        height: 1920, // Instagram story height (9:16 ratio)
      });

      // Create download link
      const link = document.createElement("a");
      link.download = `AfriTable-Passport-${user.name.replace(/\s+/g, "-")}-${new Date().getTime()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="btn-bronze px-6 py-3 text-white rounded-xl font-bold text-sm shadow-xl">
          Share My Journey
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 bg-slate-900/95 border-slate-700">
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 min-h-[80vh]">
          {/* The Story Container (9:16 Ratio) */}
          <div
            id="story-export"
            ref={storyRef}
            className="w-[360px] h-[640px] bg-brand-dark rounded-[2rem] overflow-hidden relative shadow-2xl flex flex-col"
          >
            {/* Top Branding */}
            <div className="pt-10 px-8 flex justify-between items-start z-10">
              <Image
                src="/logo.png"
                alt="AfriTable"
                width={40}
                height={40}
                className="h-10 object-contain brightness-0 invert"
              />
              <div className="text-right">
                <p className="text-[10px] font-black text-brand-ochre uppercase tracking-widest">My Culinary</p>
                <p className="text-xl font-black text-white uppercase tracking-tighter">Passport</p>
              </div>
            </div>

            {/* Big Watermark Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] w-full p-10 pointer-events-none">
              <Image
                src="/logo.png"
                alt=""
                width={300}
                height={300}
                className="w-full grayscale invert"
              />
            </div>

            {/* Content: User Stats */}
            <div className="mt-8 px-8 z-10">
              <p className="text-sm font-bold text-slate-400 mb-1">Passholder:</p>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">{user.name}</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl">
                  <p className="text-[10px] font-bold text-brand-ochre uppercase">Stamps</p>
                  <p className="text-2xl font-black text-white">{stamps.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl">
                  <p className="text-[10px] font-bold text-brand-ochre uppercase">Rank</p>
                  <p className="text-sm font-black text-white uppercase leading-tight">{rank}</p>
                </div>
              </div>
            </div>

            {/* The Stamp Grid - Visual Focus */}
            <div className="flex-1 px-8 py-10 z-10">
              <div className="grid grid-cols-2 gap-4">
                {stamps.slice(0, 4).map((stamp, i) => (
                  <div
                    key={stamp.id}
                    className={`aspect-square rounded-3xl ${stamp.color} border-4 border-white/10 flex flex-col items-center justify-center p-4 text-center ${
                      i % 2 === 0 ? "-rotate-3" : "rotate-3"
                    } shadow-lg`}
                  >
                    <p className="text-[10px] font-black text-white leading-none mb-1 uppercase tracking-tighter text-center px-1">
                      {stamp.restaurant.length > 12 ? stamp.restaurant.slice(0, 10) + "..." : stamp.restaurant}
                    </p>
                    <div className="h-[1px] w-8 bg-white/30 my-1"></div>
                    <p className="text-[8px] font-bold text-white/80 uppercase">{stamp.city}</p>
                  </div>
                ))}
                {stamps.length === 0 && (
                  <>
                    <div className="aspect-square rounded-3xl bg-brand-paper/20 border-4 border-white/10 flex items-center justify-center">
                      <p className="text-xs text-white/50">No stamps yet</p>
                    </div>
                    <div className="aspect-square rounded-3xl bg-brand-paper/20 border-4 border-white/10 flex items-center justify-center">
                      <p className="text-xs text-white/50">Start exploring</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="p-8 bg-gradient-to-t from-brand-dark via-brand-dark to-transparent z-10 text-center">
              <p className="text-xs font-bold text-slate-400 mb-4 italic">
                &quot;Exploring the flavor of the diaspora.&quot;
              </p>
              <div className="bg-brand-ochre text-brand-dark py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">
                Join the Table: AfriTable.com
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="mt-8 flex gap-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="px-6 py-3 bg-white/10 text-white border-white/20 rounded-xl font-bold text-sm hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn-bronze px-10 py-3 text-white rounded-xl font-bold text-sm shadow-xl disabled:opacity-50"
            >
              {isDownloading ? "Generating..." : "Download to Share"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
