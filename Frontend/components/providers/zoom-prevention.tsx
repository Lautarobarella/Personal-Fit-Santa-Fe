"use client";

import { useEffect } from "react";
import { initializeZoomPrevention } from "@/lib/prevent-zoom";

export function ZoomPrevention() {
  useEffect(() => {
    initializeZoomPrevention();
  }, []);

  return null;
}
