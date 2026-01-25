"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function safeImages(images?: string[] | null): string[] {
  const list = (images ?? []).filter(Boolean);
  return list.length ? list : [];
}

export function PhotoGallery({ name, images }: { name: string; images?: string[] | null }) {
  const imgs = safeImages(images);
  const [active, setActive] = React.useState(0);

  // Placeholder gradient when no images are present.
  if (!imgs.length) {
    return (
      <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-[oklch(0.94_0.05_80)] via-[oklch(0.98_0_0)] to-[oklch(0.92_0.05_145)]">
        <div className="absolute inset-0 opacity-45 [background:radial-gradient(circle_at_20%_20%,oklch(0.78_0.18_55),transparent_55%),radial-gradient(circle_at_80%_30%,oklch(0.35_0.06_145),transparent_55%)]" />
        <div className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-sm text-white">
          {name}
        </div>
      </div>
    );
  }

  const activeUrl = imgs[Math.max(0, Math.min(active, imgs.length - 1))];

  return (
    <div className="grid gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="relative h-[320px] w-full overflow-hidden rounded-2xl border bg-muted"
            onClick={() => setActive(0)}
          >
            {/* Use background-image to avoid Next/Image domain config for now */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${JSON.stringify(activeUrl).slice(1, -1)})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 text-left text-white">
              <div className="text-sm opacity-90">View photos</div>
              <div className="text-lg font-semibold">{name}</div>
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Photos</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${JSON.stringify(activeUrl).slice(1, -1)})` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setActive((i) => (i - 1 + imgs.length) % imgs.length)}
                type="button"
              >
                Prev
              </Button>
              <div className="text-sm text-muted-foreground">
                {active + 1} / {imgs.length}
              </div>
              <Button variant="outline" onClick={() => setActive((i) => (i + 1) % imgs.length)} type="button">
                Next
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {imgs.map((url, idx) => (
                <button
                  key={url + idx}
                  type="button"
                  className={cn(
                    "h-16 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted",
                    idx === active && "ring-2 ring-ring",
                  )}
                  onClick={() => setActive(idx)}
                  aria-label={`Select photo ${idx + 1}`}
                >
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${JSON.stringify(url).slice(1, -1)})` }}
                  />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {imgs.slice(0, 8).map((url, idx) => (
          <button
            key={url + idx}
            type="button"
            className={cn("h-16 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted", idx === 0 && "ring-1 ring-border")}
            onClick={() => setActive(idx)}
            aria-label={`Preview photo ${idx + 1}`}
          >
            <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(url).slice(1, -1)})` }} />
          </button>
        ))}
      </div>
    </div>
  );
}

