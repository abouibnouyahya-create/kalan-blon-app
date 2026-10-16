"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Eleve = {
  id: number;
  nom: string;
  prenom: string;
  classe: string;
  serie: string | null;
};

type Statut = "present" | "absent" | "retard";

export default function FaireAppel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const classeParam = searchParams.get("classe") || "";

  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [statuts, setStatuts] = useState<{ [eleveId: number]: Statut }>({});
  const [motifs, setMotifs] = useState<{ [eleveId: number]: string }>({});
  const [motifOuvert, setMotifOuvert] = useState<number | null>(null);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [verif, setVerif] = useState(true);

  const aujourdhui = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function charger() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Récupérer la classe sans le suffixe de série pour le filtre
      const classeMatch = classeParam.match(/^(\S+)/);
      const classe = classeMatch ? classeMatch[1] : classeParam;

      const { data: elevesData } = await supabase
        .from("eleves")
        .select("id, nom, prenom, classe, serie")
        .eq("user_id", user.id)
        .eq("classe", classe)
        .order("nom", { ascending: true });

      // Charger les absences déjà enregistrées aujourd'hui
      const { data: absencesData } = await supabase
        .from("absences")
        .select("eleve_id, statut, motif")
        .eq("user_id", user.id)
        .eq("date_absence", aujourdhui);

      const statutsInit: { [eleveId: number]: Statut } = {};
      const motifsInit: { [eleveId: number]: string } = {};

      (elevesData || []).forEach((e) => {
        statutsInit[e.id] = "present";
      });

      (absencesData || []).forEach((a) => {
        if (
          (elevesData || []).some((e) => e.id === a.eleve_id)
        ) {
          statutsInit[a.eleve_id] = a.statut as Statut;
          if (a.motif) motifsInit[a.eleve_id] = a.motif;
        }
      });

      setEleves(elevesData || []);
      setStatuts(statutsInit);
      setMotifs(motifsInit);
      setChargement(false);
      setVerif(false);
    }
    charger();
  }, [classeParam, router, supabase, aujourdhui]);

  function changerStatut(eleveId: number, statut: Statut) {
    setStatuts({ ...statuts, [eleveId]: statut });
    if (statut === "absent" || statut === "retard") {
      setMotifOuvert(eleveId);
    } else {
      if (motifOuvert === eleveId) setMotifOuvert(null);
    }
  }

  async function enregistrer() {
    setEnregistrement(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Supprimer les anciennes entrées du jour pour ces élèves
    const ids = eleves.map((e) => e.id);
    await supabase
      .from("absences")
      .delete()
      .eq("user_id", user.id)
      .eq("date_absence", aujourdhui)
      .in("eleve_id", ids);

    // Ne conserver que absents et retards
    const aEnregistrer = eleves
      .filter((e) => statuts[e.id] !== "present")
      .map((e) => ({
        user_id: user.id,
        eleve_id: e.id,
        date_absence: aujourdhui,
        statut: statuts[e.id],
        motif: motifs[e.id] || null,
      }));

    if (aEnregistrer.length > 0) {
      const { error } = await supabase.from("absences").insert(aEnregistrer);
      if (error) {
        alert("Erreur : " + error.message);
        setEnregistrement(false);
        return;
      }
    }

    setEnregistrement(false);
    router.push("/absences");
  }

  // Statistiques
  const nbPresents = Object.values(statuts).filter(
    (s) => s === "present"
  ).length;
  const nbAbsents = Object.values(statuts).filter(
    (s) => s === "absent"
  ).length;
  const nbRetards = Object.values(statuts).filter(
    (s) => s === "retard"
  ).length;

  if (verif || chargement) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf6ec]">
        <p className="text-[#3e2723]/60 citation-kalan text-lg">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf6ec] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/absences"
            className="text-sm text-[#3e2723]/60 hover:text-[#3e2723]"
          >
            ← Retour aux classes
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="titre-kalan text-3xl md:text-4xl font-bold text-[#14532d] mb-2">
            Appel — {classeParam}
          </h1>
          <p className="text-[#3e2723]/60 text-sm">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#14b53a] text-white rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{nbPresents}</p>
            <p className="text-xs opacity-90">Présents</p>
          </div>
          <div className="bg-[#ce1126] text-white rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{nbAbsents}</p>
            <p className="text-xs opacity-90">Absents</p>
          </div>
          <div className="bg-[#fcd116] text-[#3e2723] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{nbRetards}</p>
            <p className="text-xs opacity-90">Retards</p>
          </div>
        </div>

        {/* Liste des élèves */}
        <div className="space-y-2 mb-6">
          {eleves.map((e) => {
            const statut = statuts[e.id] || "present";
            return (
              <div
                key={e.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-[#3e2723]/5"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#14b53a]/10 flex items-center justify-center text-sm font-bold text-[#14532d] shrink-0">
                      {e.prenom.charAt(0)}
                      {e.nom.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#3e2723] truncate">
                        {e.prenom} {e.nom}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => changerStatut(e.id, "present")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                        statut === "present"
                          ? "bg-[#14b53a] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      ✅ Présent
                    </button>
                    <button
                      onClick={() => changerStatut(e.id, "absent")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                        statut === "absent"
                          ? "bg-[#ce1126] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      ❌ Absent
                    </button>
                    <button
                      onClick={() => changerStatut(e.id, "retard")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                        statut === "retard"
                          ? "bg-[#fcd116] text-[#3e2723]"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      🕐 Retard
                    </button>
                  </div>
                </div>

                {/* Motif (affiché pour absent ou retard) */}
                {motifOuvert === e.id &&
                  (statut === "absent" || statut === "retard") && (
                    <div className="mt-3 pt-3 border-t border-[#3e2723]/10">
                      <label className="block text-xs font-semibold text-[#3e2723]/60 mb-1">
                        Motif (optionnel)
                      </label>
                      <input
                        type="text"
                        value={motifs[e.id] || ""}
                        onChange={(ev) =>
                          setMotifs({ ...motifs, [e.id]: ev.target.value })
                        }
                        placeholder="Ex : Maladie, raison familiale…"
                        className="w-full border border-[#3e2723]/10 rounded-lg p-2 text-sm focus:border-[#14b53a] focus:outline-none"
                      />
                    </div>
                  )}
              </div>
            );
          })}
        </div>

        {/* Bouton enregistrer */}
        <button
          onClick={enregistrer}
          disabled={enregistrement}
          className="w-full bg-[#14b53a] hover:bg-[#0f8c2c] text-white py-4 rounded-lg font-semibold text-lg shadow-md transition disabled:opacity-50 sticky bottom-4"
        >
          {enregistrement
            ? "Enregistrement…"
            : `💾 Enregistrer l'appel (${nbPresents} présents, ${nbAbsents} absents, ${nbRetards} retards)`}
        </button>
      </div>
    </main>
  );
}