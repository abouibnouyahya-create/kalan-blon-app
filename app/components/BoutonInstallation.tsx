"use client";

import { useEffect, useState } from "react";

export default function BoutonInstallation() {
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function gererBeforeInstall(e: any) {
      e.preventDefault();
      setPromptInstall(e);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", gererBeforeInstall);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setVisible(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", gererBeforeInstall);
    };
  }, []);

  async function installer() {
    if (!promptInstall) return;
    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm print:hidden">
      <div className="bg-[#14532d] text-white rounded-xl shadow-xl p-4 flex items-center gap-4">
        <div className="text-3xl">📲</div>
        <div className="flex-1">
          <p className="font-bold text-sm">Installer Kalan Blon</p>
          <p className="text-xs text-white/70">
            Accès rapide depuis votre téléphone
          </p>
        </div>
        <button
          onClick={installer}
          className="bg-[#14b53a] hover:bg-[#0f8c2c] px-4 py-2 rounded-lg font-semibold text-sm transition"
        >
          Installer
        </button>
        <button
          onClick={() => setVisible(false)}
          className="text-white/50 hover:text-white text-xl"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  );
}