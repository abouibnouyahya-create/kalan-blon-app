"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BoutonInstallation from "@/app/components/BoutonInstallation";

type Fiche = {
  id: number;
  created_at: string;
  discipline: string | null;
};

export default function Accueil() {
  const router = useRouter();
  const supabase = createClient();

  const [prenom, setPrenom] = useState<string>("");
  const [etablissement, setEtablissement] = useState<string>("");
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [chargementStats, setChargementStats] = useState(true);
  const [verif, setVerif] = useState(true);

  useEffect(() => {
    async function charger() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const nomMeta = (user.user_metadata?.nom as string) || "";
      const etabMeta = (user.user_metadata?.etablissement as string) || "";
      setPrenom(nomMeta);
      setEtablissement(etabMeta);

      const { data, error } = await supabase
        .from("fiches")
        .select("id, created_at, discipline")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
      } else {
        setFiches(data || []);
      }
      setChargementStats(false);
      setVerif(false);
    }
    charger();
  }, [router, supabase]);

  async function deconnexion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const total = fiches.length;

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);
  const ceMois = fiches.filter(
    (f) => new Date(f.created_at) >= debutMois
  ).length;

  const disciplinesUniques = new Set(
    fiches.map((f) => f.discipline).filter(Boolean)
  ).size;

  if (verif) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf6ec]">
        <p className="text-[#3e2723]/60 citation-kalan text-lg">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex relative bg-[#faf6ec]">
      <div className="bande-tricolore w-2 md:w-3 h-screen fixed left-0 top-0 z-10" />

      <div className="flex-1 ml-2 md:ml-3 motif-bogolan">
        <nav className="border-b border-[#3e2723]/10 bg-white/60 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/accueil"
              className="titre-kalan text-2xl font-bold text-[#14532d]"
            >
              Kalan Blon
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/accueil" className="font-medium text-[#14b53a]">
                Accueil
              </Link>
              <Link href="/cours" className="font-medium hover:text-[#14b53a]">
                Mes fiches
              </Link>
              <Link
                href="/cours/nouveau"
                className="bg-[#14b53a] hover:bg-[#0f8c2c] text-white px-4 py-2 rounded-lg font-medium transition"
              >
                + Créer
              </Link>
              <button
                onClick={deconnexion}
                className="text-[#3e2723]/60 hover:text-[#ce1126] font-medium transition"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="mb-14">
            <h1 className="titre-kalan text-4xl md:text-5xl font-bold text-[#14532d] mb-3">
              Bienvenue, {prenom || "enseignant"}
            </h1>
            <p className="text-lg text-[#3e2723]/70 citation-kalan">
              {etablissement
                ? `${etablissement} — Prêt à ouvrir la porte du savoir pour vos élèves ?`
                : "Prêt à ouvrir la porte du savoir pour vos élèves ?"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#3e2723]/5">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-4xl font-bold text-[#14532d] mb-1">
                {chargementStats ? "—" : total}
              </div>
              <div className="text-sm text-[#3e2723]/60">
                {total > 1 ? "Fiches créées" : "Fiche créée"}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#3e2723]/5">
              <div className="text-3xl mb-2">✍️</div>
              <div className="text-4xl font-bold text-[#14532d] mb-1">
                {chargementStats ? "—" : ceMois}
              </div>
              <div className="text-sm text-[#3e2723]/60">
                {ceMois > 1 ? "Fiches ce mois-ci" : "Fiche ce mois-ci"}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#3e2723]/5">
              <div className="text-3xl mb-2">🏫</div>
              <div className="text-4xl font-bold text-[#14532d] mb-1">
                {chargementStats ? "—" : disciplinesUniques}
              </div>
              <div className="text-sm text-[#3e2723]/60">
                {disciplinesUniques > 1
                  ? "Disciplines couvertes"
                  : "Discipline couverte"}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-14">
            <Link
              href="/cours/nouveau"
              className="group bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all border border-[#3e2723]/5 hover:border-[#14b53a]/30"
            >
              <div className="text-4xl mb-4">✍️</div>
              <h2 className="text-2xl font-bold text-[#14532d] mb-2">
                Créer une fiche APC
              </h2>
              <p className="text-[#3e2723]/70">
                Générez une fiche de cours complète en quelques minutes, adaptée
                à votre classe et conforme à l'APC.
              </p>
              <div className="mt-6 text-[#14b53a] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                Commencer →
              </div>
            </Link>

            <Link
              href="/cours"
              className="group bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all border border-[#3e2723]/5 hover:border-[#14b53a]/30"
            >
              <div className="text-4xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-[#14532d] mb-2">
                Mes fiches
              </h2>
              <p className="text-[#3e2723]/70">
                Retrouvez toutes vos fiches sauvegardées et rouvrez-les en un
                clic.
              </p>
              <div className="mt-6 text-[#14b53a] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                Voir mes fiches →
              </div>
            </Link>
          </div>

          <div className="bg-white/70 border-l-4 border-[#fcd116] rounded-r-lg p-6">
            <p className="citation-kalan text-lg text-[#3e2723]">
              « L'école est la lumière qui éclaire le chemin de la nation. »
            </p>
            <p className="text-xs text-[#3e2723]/50 mt-2 tracking-widest uppercase">
              Sagesse malienne
            </p>
          </div>
        </div>
      </div>

      <BoutonInstallation />
    </main>
  );
}