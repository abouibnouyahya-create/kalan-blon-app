"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EcranChargement from "@/app/components/EcranChargement";

export default function NouveauQuiz() {
  const router = useRouter();
  const supabase = createClient();

  const [classe, setClasse] = useState("10eme");
  const [discipline, setDiscipline] = useState("Mathematiques");
  const [theme, setTheme] = useState("");
  const [difficulte, setDifficulte] = useState("moyen");
  const [nbQuestions, setNbQuestions] = useState(10);
  const [chargement, setChargement] = useState(false);
  const [verif, setVerif] = useState(true);

  useEffect(() => {
    async function verifier() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setVerif(false);
    }
    verifier();
  }, [router, supabase]);

  async function generer() {
    if (!theme.trim()) {
      alert("Remplis le thème du quiz");
      return;
    }
    setChargement(true);

    try {
      const reponse = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classe,
          discipline,
          theme,
          difficulte,
          nbQuestions,
        }),
      });

      const data = await reponse.json();

      if (data.erreur || !data.questions) {
        alert(data.erreur || "Erreur lors de la génération");
        setChargement(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: nouveau, error } = await supabase
        .from("quiz")
        .insert([
          {
            user_id: user.id,
            classe,
            discipline,
            theme,
            difficulte,
            nb_questions: data.questions.length,
            questions: data.questions,
            titre: data.titre || `Quiz — ${theme}`,
          },
        ])
        .select()
        .single();

      if (error) {
        alert("Erreur : " + error.message);
        setChargement(false);
        return;
      }

      router.push(`/quiz/${nouveau.id}`);
    } catch (e) {
      alert("Erreur lors de la génération.");
      setChargement(false);
    }
  }

  if (verif) {
    return (
      <EcranChargement message="Chargement de Kalan Blon…" dureeEstimee={3} />
    );
  }

  if (chargement) {
    return (
      <EcranChargement
        message="Génération du quiz en cours…"
        dureeEstimee={30}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#faf6ec] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/quiz"
            className="text-sm text-[#3e2723]/60 hover:text-[#3e2723]"
          >
            ← Retour à mes quiz
          </Link>
        </div>

        <h1 className="titre-kalan text-3xl md:text-4xl font-bold text-[#14532d] mb-6">
          Créer un quiz
        </h1>

        <div className="bg-white p-6 rounded-lg shadow space-y-5">
          <div>
            <label className="block font-semibold mb-1">Classe</label>
            <select
              value={classe}
              onChange={(e) => setClasse(e.target.value)}
              className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
            >
              <option value="10eme">10ème année</option>
              <option value="11eme">11ème année</option>
              <option value="12eme">12ème (Terminale)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Discipline</label>
            <input
              type="text"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              placeholder="Ex : Mathématiques"
              className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Thème / Chapitre</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex : Les équations du second degré"
              className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Difficulté</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "facile", l: "🟢 Facile" },
                { v: "moyen", l: "🟡 Moyen" },
                { v: "difficile", l: "🔴 Difficile" },
              ].map((d) => (
                <button
                  key={d.v}
                  onClick={() => setDifficulte(d.v)}
                  className={`py-3 rounded-lg font-semibold border-2 transition ${
                    difficulte === d.v
                      ? "bg-[#14b53a] text-white border-[#14b53a]"
                      : "bg-white border-[#3e2723]/10 hover:border-[#14b53a]/50"
                  }`}
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">
              Nombre de questions : <span className="text-[#14b53a]">{nbQuestions}</span>
            </label>
            <input
              type="range"
              min={5}
              max={20}
              step={5}
              value={nbQuestions}
              onChange={(e) => setNbQuestions(parseInt(e.target.value))}
              className="w-full accent-[#14b53a]"
            />
            <div className="flex justify-between text-xs text-[#3e2723]/50 mt-1">
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
          </div>

          <button
            onClick={generer}
            className="w-full bg-[#14b53a] hover:bg-[#0f8c2c] text-white py-4 rounded-lg font-semibold text-lg transition"
          >
            🎯 Générer le quiz
          </button>
        </div>
      </div>
    </main>
  );
}