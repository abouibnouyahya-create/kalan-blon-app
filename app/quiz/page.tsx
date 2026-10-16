"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Quiz = {
  id: number;
  created_at: string;
  classe: string;
  discipline: string;
  theme: string;
  difficulte: string;
  nb_questions: number;
  titre: string | null;
};

export default function MesQuiz() {
  const router = useRouter();
  const supabase = createClient();

  const [quiz, setQuiz] = useState<Quiz[]>([]);
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

      const { data } = await supabase
        .from("quiz")
        .select("id, created_at, classe, discipline, theme, difficulte, nb_questions, titre")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setQuiz(data || []);
      setChargement(false);
    }
    charger();
  }, [router, supabase]);

  async function supprimer(id: number) {
    if (!confirm("Supprimer ce quiz ?")) return;
    const { error } = await supabase.from("quiz").delete().eq("id", id);
    if (error) {
      alert("Erreur : " + error.message);
    } else {
      setQuiz(quiz.filter((q) => q.id !== id));
    }
  }

  function libelleDifficulte(d: string) {
    if (d === "facile") return "🟢 Facile";
    if (d === "difficile") return "🔴 Difficile";
    return "🟡 Moyen";
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const quizFiltres = quiz.filter(
    (q) =>
      q.theme.toLowerCase().includes(recherche.toLowerCase()) ||
      q.discipline.toLowerCase().includes(recherche.toLowerCase()) ||
      (q.titre || "").toLowerCase().includes(recherche.toLowerCase())
  );

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
              <Link href="/accueil" className="font-medium hover:text-[#14b53a]">
                Accueil
              </Link>
              <Link href="/eleves" className="font-medium hover:text-[#14b53a]">
                Élèves
              </Link>
              <Link href="/absences" className="font-medium hover:text-[#14b53a]">
                Absences
              </Link>
              <Link href="/quiz" className="font-medium text-[#14b53a]">
                Quiz
              </Link>
              <Link
                href="/quiz/nouveau"
                className="bg-[#14b53a] hover:bg-[#0f8c2c] text-white px-4 py-2 rounded-lg font-medium transition"
              >
                + Créer
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="mb-8">
            <h1 className="titre-kalan text-3xl md:text-5xl font-bold text-[#14532d] mb-3">
              Mes quiz
            </h1>
            <p className="text-[#3e2723]/70 citation-kalan text-sm md:text-lg">
              Retrouvez tous vos quiz générés
            </p>
          </div>

          <div className="mb-6">
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par thème, discipline ou titre…"
              className="w-full md:w-96 border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none bg-white"
            />
          </div>

          {chargement && (
            <div className="text-center py-16 text-[#3e2723]/60 citation-kalan text-lg">
              Chargement…
            </div>
          )}

          {!chargement && quizFiltres.length === 0 && (
            <div className="bg-white/70 rounded-xl p-12 text-center border border-[#3e2723]/5">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-[#14532d] mb-2">
                {recherche ? "Aucun résultat" : "Aucun quiz pour le moment"}
              </h2>
              <p className="text-[#3e2723]/70 mb-6">
                {recherche
                  ? "Essayez un autre mot-clé."
                  : "Commencez par générer votre premier quiz."}
              </p>
              {!recherche && (
                <Link
                  href="/quiz/nouveau"
                  className="inline-block bg-[#14b53a] hover:bg-[#0f8c2c] text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Créer mon premier quiz
                </Link>
              )}
            </div>
          )}

          {!chargement && quizFiltres.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {quizFiltres.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border border-[#3e2723]/5 flex flex-col"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#14532d] leading-tight mb-1">
                          {q.titre || q.theme}
                        </h3>
                        <p className="text-xs text-[#3e2723]/60">
                          {q.classe} · {q.discipline}
                        </p>
                      </div>
                      <button
                        onClick={() => supprimer(q.id)}
                        className="text-[#ce1126]/60 hover:text-[#ce1126] text-sm shrink-0"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs mb-3 flex-wrap">
                      <span className="bg-[#14b53a]/10 text-[#14532d] px-2 py-1 rounded-full font-semibold">
                        {q.nb_questions} questions
                      </span>
                      <span className="bg-[#3e2723]/5 px-2 py-1 rounded-full">
                        {libelleDifficulte(q.difficulte)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#3e2723]/10 pt-3 flex items-center justify-between">
                    <span className="text-xs text-[#3e2723]/50">
                      {formatDate(q.created_at)}
                    </span>
                    <Link
                      href={`/quiz/${q.id}`}
                      className="text-[#14b53a] font-semibold flex items-center gap-2 transition-all hover:gap-3"
                    >
                      Commencer →
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