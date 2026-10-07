"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Fiche = {
  id: number;
  created_at: string;
  theme: string;
  discipline: string | null;
  classe: string | null;
  serie: string | null;
  duree: string | null;
};

export default function MesFiches() {
  const router = useRouter();
  const supabase = createClient();

  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    async function charger() {
      setChargement(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("fiches")
        .select("id, created_at, theme, discipline, classe, serie, duree")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setFiches(data || []);
      }
      setChargement(false);
    }
    charger();
  }, [router, supabase]);

  async function supprimer(id: number) {
    if (!confirm("Supprimer cette fiche ?")) return;
    const { error } = await supabase.from("fiches").delete().eq("id", id);
    if (error) {
      alert("Erreur : " + error.message);
    } else {
      setFiches(fiches.filter((f) => f.id !== id));
    }
  }

  const fichesFiltrees = fiches.filter(
    (f) =>
      f.theme.toLowerCase().includes(recherche.toLowerCase()) ||
      (f.discipline || "").toLowerCase().includes(recherche.toLowerCase())
  );

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              <Link href="/accueil" className="font-medium hover:text-[#14b53a]">
                Accueil
              </Link>
              <Link href="/cours" className="font-medium text-[#14b53a]">
                Mes fiches
              </Link>
              <Link
                href="/cours/nouveau"
                className="bg-[#14b53a] hover:bg-[#0f8c2c] text-white px-4 py-2 rounded-lg font-medium transition"
              >
                + Créer
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="titre-kalan text-4xl md:text-5xl font-bold text-[#14532d] mb-3">
              Mes fiches
            </h1>
            <p className="text-[#3e2723]/70 citation-kalan text-lg">
              Retrouvez toutes vos fiches de cours APC
            </p>
          </div>

          <div className="mb-6">
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par thème ou discipline…"
              className="w-full md:w-96 border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none bg-white"
            />
          </div>

          {chargement && (
            <div className="text-center py-16 text-[#3e2723]/60 citation-kalan text-lg">
              Chargement de vos fiches…
            </div>
          )}

          {!chargement && fichesFiltrees.length === 0 && (
            <div className="bg-white/70 rounded-xl p-12 text-center border border-[#3e2723]/5">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-[#14532d] mb-2">
                {recherche ? "Aucun résultat" : "Aucune fiche pour le moment"}
              </h2>
              <p className="text-[#3e2723]/70 mb-6">
                {recherche
                  ? "Essayez un autre mot-clé."
                  : "Commencez par créer votre première fiche de cours APC."}
              </p>
              {!recherche && (
                <Link
                  href="/cours/nouveau"
                  className="inline-block bg-[#14b53a] hover:bg-[#0f8c2c] text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Créer ma première fiche
                </Link>
              )}
            </div>
          )}

          {!chargement && fichesFiltrees.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {fichesFiltrees.map((fiche) => (
                <div
                  key={fiche.id}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border border-[#3e2723]/5 flex flex-col"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-xl font-bold text-[#14532d] leading-tight">
                        {fiche.theme}
                      </h3>
                      <button
                        onClick={() => supprimer(fiche.id)}
                        className="text-[#ce1126]/60 hover:text-[#ce1126] transition text-sm"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="space-y-1 text-sm text-[#3e2723]/70 mb-4">
                      {fiche.discipline && (
                        <p>
                          <span className="font-semibold">Discipline :</span>{" "}
                          {fiche.discipline}
                        </p>
                      )}
                      {fiche.classe && (
                        <p>
                          <span className="font-semibold">Classe :</span>{" "}
                          {fiche.classe}
                          {fiche.serie && fiche.serie !== "commune"
                            ? ` (${fiche.serie})`
                            : ""}
                        </p>
                      )}
                      {fiche.duree && (
                        <p>
                          <span className="font-semibold">Durée :</span>{" "}
                          {fiche.duree} min
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#3e2723]/10 pt-4 flex items-center justify-between">
                    <span className="text-xs text-[#3e2723]/50">
                      {formatDate(fiche.created_at)}
                    </span>
                    <Link
                      href={`/cours/${fiche.id}`}
                      className="text-[#14b53a] font-semibold hover:gap-3 flex items-center gap-2 transition-all"
                    >
                      Ouvrir →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}