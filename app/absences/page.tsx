"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Eleve = {
  id: number;
  nom: string;
  prenom: string;
  classe: string;
  serie: string | null;
};

type AbsenceAujourdhui = {
  eleve_id: number;
  statut: string;
};

export default function AbsencesAccueil() {
  const router = useRouter();
  const supabase = createClient();

  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [absencesAujourdhui, setAbsencesAujourdhui] = useState<
    AbsenceAujourdhui[]
  >([]);
  const [chargement, setChargement] = useState(true);

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

      const { data: elevesData } = await supabase
        .from("eleves")
        .select("id, nom, prenom, classe, serie")
        .eq("user_id", user.id)
        .order("classe", { ascending: true });

      const aujourdhui = new Date().toISOString().split("T")[0];

      const { data: absencesData } = await supabase
        .from("absences")
        .select("eleve_id, statut")
        .eq("user_id", user.id)
        .eq("date_absence", aujourdhui);

      setEleves(elevesData || []);
      setAbsencesAujourdhui(absencesData || []);
      setChargement(false);
    }
    charger();
  }, [router, supabase]);

  // Regrouper par classe
  const classesMap: { [classe: string]: Eleve[] } = {};
  eleves.forEach((e) => {
    const key = `${e.classe}${e.serie && e.serie !== "commune" ? ` ${e.serie}` : ""}`;
    if (!classesMap[key]) classesMap[key] = [];
    classesMap[key].push(e);
  });

  const classes = Object.keys(classesMap).sort();

  function statsClasse(classeNom: string) {
    const elevesClasse = classesMap[classeNom] || [];
    const idsClasse = elevesClasse.map((e) => e.id);
    const absencesClasse = absencesAujourdhui.filter((a) =>
      idsClasse.includes(a.eleve_id)
    );
    const absents = absencesClasse.filter(
      (a) => a.statut === "absent"
    ).length;
    const retards = absencesClasse.filter(
      (a) => a.statut === "retard"
    ).length;
    const appeles = absencesClasse.length;
    return {
      total: elevesClasse.length,
      absents,
      retards,
      restants: elevesClasse.length - appeles,
      dejaFait: appeles === elevesClasse.length && elevesClasse.length > 0,
    };
  }

  return (
    <main className="min-h-screen flex relative bg-[#faf6ec]">
      <div className="bande-tricolore w-2 md:w-3 h-screen fixed left-0 top-0 z-10" />

      <div className="flex-1 ml-2 md:ml-3 motif-bogolan">
        <nav className="border-b border-[#3e2723]/10 bg-white/60 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <Link
              href="/accueil"
              className="titre-kalan text-xl md:text-2xl font-bold text-[#14532d]"
            >
              Kalan Blon
            </Link>
            <div className="flex items-center gap-4 md:gap-5 text-sm">
              <Link
                href="/accueil"
                className="font-medium hover:text-[#14b53a]"
              >
                Accueil
              </Link>
              <Link
                href="/eleves"
                className="font-medium hover:text-[#14b53a]"
              >
                Élèves
              </Link>
              <Link href="/absences" className="font-medium text-[#14b53a]">
                Absences
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="mb-8">
            <h1 className="titre-kalan text-3xl md:text-5xl font-bold text-[#14532d] mb-3">
              Faire l'appel
            </h1>
            <p className="text-[#3e2723]/70 citation-kalan text-sm md:text-lg">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {chargement && (
            <div className="text-center py-16 text-[#3e2723]/60 citation-kalan text-lg">
              Chargement…
            </div>
          )}

          {!chargement && classes.length === 0 && (
            <div className="bg-white/70 rounded-xl p-12 text-center border border-[#3e2723]/5">
              <div className="text-5xl mb-4">👥</div>
              <h2 className="text-2xl font-bold text-[#14532d] mb-2">
                Aucun élève pour le moment
              </h2>
              <p className="text-[#3e2723]/70 mb-6">
                Ajoutez des élèves avant de pouvoir faire l'appel.
              </p>
              <Link
                href="/eleves/nouveau"
                className="inline-block bg-[#14b53a] hover:bg-[#0f8c2c] text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Ajouter un élève
              </Link>
            </div>
          )}

          {!chargement && classes.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {classes.map((classeNom) => {
                const s = statsClasse(classeNom);
                return (
                  <Link
                    key={classeNom}
                    href={`/absences/appel?classe=${encodeURIComponent(
                      classeNom
                    )}`}
                    className={`group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border-2 ${
                      s.dejaFait
                        ? "border-[#14b53a]/40"
                        : "border-[#3e2723]/5 hover:border-[#14b53a]/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-[#14532d]">
                          {classeNom}
                        </h2>
                        <p className="text-sm text-[#3e2723]/60">
                          {s.total} élève{s.total > 1 ? "s" : ""}
                        </p>
                      </div>
                      {s.dejaFait ? (
                        <span className="text-xs bg-[#14b53a] text-white px-3 py-1 rounded-full font-semibold">
                          ✅ Appel fait
                        </span>
                      ) : (
                        <span className="text-xs bg-[#fcd116] text-[#3e2723] px-3 py-1 rounded-full font-semibold">
                          ⏳ {s.restants} à appeler
                        </span>
                      )}
                    </div>

                    {s.dejaFait && (
                      <div className="flex gap-3 text-sm">
                        <span className="text-[#ce1126] font-semibold">
                          🔴 {s.absents} absent{s.absents > 1 ? "s" : ""}
                        </span>
                        <span className="text-orange-600 font-semibold">
                          🟡 {s.retards} retard{s.retards > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 text-[#14b53a] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                      {s.dejaFait ? "Modifier l'appel" : "Faire l'appel"} →
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}