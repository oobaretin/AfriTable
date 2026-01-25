"use client";

import * as React from "react";
import Link from "next/link";

const TOP_CITIES: { label: string; href: string }[] = [
  { label: "Houston", href: "/restaurants?city=Houston%2C%20TX" },
  { label: "Atlanta", href: "/restaurants?city=Atlanta%2C%20GA" },
  { label: "Washington, DC", href: "/restaurants?city=Washington%2C%20DC" },
  { label: "New York City", href: "/restaurants?city=New%20York%2C%20NY" },
  { label: "Los Angeles", href: "/restaurants?city=Los%20Angeles%2C%20CA" },
  { label: "Dallas", href: "/restaurants?city=Dallas%2C%20TX" },
  { label: "Chicago", href: "/restaurants?city=Chicago%2C%20IL" },
  { label: "Philadelphia", href: "/restaurants?city=Philadelphia%2C%20PA" },
  { label: "Miami", href: "/restaurants?city=Miami%2C%20FL" },
  { label: "Baltimore", href: "/restaurants?city=Baltimore%2C%20MD" },
  { label: "Charlotte", href: "/restaurants?city=Charlotte%2C%20NC" },
  { label: "Phoenix", href: "/restaurants?city=Phoenix%2C%20AZ" },
];

const TOP_CUISINES: { label: string; href: string }[] = [
  { label: "Nigerian", href: "/restaurants?cuisine=Nigerian" },
  { label: "Ethiopian", href: "/restaurants?cuisine=Ethiopian" },
  { label: "Ghanaian", href: "/restaurants?cuisine=Ghanaian" },
  { label: "Senegalese", href: "/restaurants?cuisine=Senegalese" },
  { label: "Somali", href: "/restaurants?cuisine=Somali" },
  { label: "Eritrean", href: "/restaurants?cuisine=Eritrean" },
  { label: "Kenyan", href: "/restaurants?cuisine=Kenyan" },
  { label: "South African", href: "/restaurants?cuisine=South%20African" },
  { label: "Jamaican", href: "/restaurants?cuisine=Jamaican" },
  { label: "Trinidadian", href: "/restaurants?cuisine=Trinidadian" },
  { label: "Haitian", href: "/restaurants?cuisine=Haitian" },
  { label: "Other Caribbean", href: "/restaurants?cuisine=Other%20Caribbean" },
];

function List({
  title,
  items,
  initialCount = 6,
}: {
  title: string;
  items: { label: string; href: string }[];
  initialCount?: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? items : items.slice(0, initialCount);

  return (
    <div className="grid gap-2 text-sm leading-6">
      <div className="text-xs font-semibold uppercase tracking-wide text-foreground/90">{title}</div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {visible.map((i) => (
          <Link
            key={i.href}
            className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
            href={i.href}
          >
            {i.label}
          </Link>
        ))}
      </div>
      {items.length > initialCount ? (
        <button
          type="button"
          className="w-fit text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

export default function FooterExpandedLists() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <List title="Top cities" items={TOP_CITIES} />
      <List title="Top cuisines" items={TOP_CUISINES} />
    </div>
  );
}

