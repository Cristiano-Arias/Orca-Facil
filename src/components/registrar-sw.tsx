"use client";

import { useEffect } from "react";

// Registra o service worker para o app poder ser instalado no celular (PWA).
export default function RegistrarSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
