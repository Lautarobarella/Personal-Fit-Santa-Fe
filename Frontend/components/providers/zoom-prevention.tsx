"use client";

import { initializeZoomPrevention } from "@/lib/prevent-zoom";
import { useEffect } from "react";

export function ZoomPrevention() {
  useEffect(() => {
    initializeZoomPrevention();
  }, []);

  return null;
}
