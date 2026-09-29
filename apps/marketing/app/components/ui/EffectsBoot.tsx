"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initEffects } from "@/app/lib/effects";

/** Boots the data-attribute effects once per page, including after client-side navigation. */
export function EffectsBoot() {
  const pathname = usePathname();
  useEffect(() => initEffects(document), [pathname]);
  return null;
}
