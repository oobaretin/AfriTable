"use client";

import * as React from "react";

type HeroSearchCityContextValue = {
  city: string;
  setCity: React.Dispatch<React.SetStateAction<string>>;
};

const HeroSearchCityContext = React.createContext<HeroSearchCityContextValue | null>(null);

export function HeroSearchCityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = React.useState("");
  const value = React.useMemo(() => ({ city, setCity }), [city]);
  return <HeroSearchCityContext.Provider value={value}>{children}</HeroSearchCityContext.Provider>;
}

export function useHeroSearchCity(): HeroSearchCityContextValue | null {
  return React.useContext(HeroSearchCityContext);
}
