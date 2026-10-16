"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Question = {
  question: string;
  type: string;
  options: string[];
  reponse: number;
  explication: string;
};

type Quiz = {
  id: number;
  classe: string;
  discipline: string;
  theme: string;
  difficulte: string;
  nb_questions: number;
  questions: Question[];
  titre: string | null;
};

type Mode = "menu" | "test" | "revision" | "resultat";

export default function FaireQuiz() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [chargement, setChargement] = useState(true);
  const [mode, setMode] = useState<Mode>("menu");
  const [indexQuestion, setIndexQuestion] = useState(0);
  const [reponses, setReponses] = useState<{ [i: number]: number }>({});
  const [reponseSelectionnee, setReponseSelectionnee] = useState<number | null>(
    null
  );
  const [aValide, setAValide] = useState(false);

  useEffect(() => {
    async function charger() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("quiz")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        alert("Quiz introuvable");
        router.push("/quiz");
        return;
      }
      setQuiz(data);
      setChargement(false);
    }
    charger();
  }, [id, router, supabase]);

  function demarrerMode(m: Mode) {
    setMode(m);
    setIndexQuestion(0);
    setReponses({});
    setReponseSelectionnee(null);
    setAValide(false);
  }

  function validerReponse() {
    if (reponseSelectionnee === null) return;
    setReponses({ ...reponses, [indexQuestion]: reponseSelectionnee });
    setAValide(true);
  }

  function questionSuivante() {
    if (!quiz) return;
    if (indexQuestion < quiz.questions.length - 1) {
      setIndexQuestion(indexQuestion + 1);
      setReponseSelectionnee(reponses[indexQuestion + 1] ?? null);
      setAValide(reponses[indexQuestion + 1] !== undefined);
    } else {
      setMode("resultat");
    }
  }

  function questionPrecedente() {
    if (indexQuestion > 0) {
      setIndexQuestion(indexQuestion - 1);
      setReponseSelectionnee(reponses[indexQuestion - 1] ?? null);
      setAValide(reponses[indexQuestion - 1] !== undefined);
    }
  }

  if (chargement) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf6ec]">
        <p className="text-[#3e2723]/60 citation-kalan text-lg">Chargement…</p>
      </main>
    );
  }

  if (!quiz) return null;

  const questionActuelle = quiz.questions[indexQuestion];
  const nbBonnesReponses = Object.keys(reponses).filter(
    (k) => reponses[parseInt(k)] === quiz.questions[parseInt(k)].reponse
  ).length;
  const note20 = ((nbBonnesReponses / quiz.questions.length) * 20).toFixed(1);

  // ---------- MENU ----------
  if (mode === "menu") {
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

          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#3e2723]/5">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎯</div>
              <h1 className="titre-kalan text-3xl font-bold text-[#14532d] mb-2">
                {quiz.titre || quiz.theme}
              </h1>
              <p className="text-[#3e2723]/60 text-sm">
                {quiz.classe} · {quiz.discipline} · {quiz.nb_questions} questions
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => demarrerMode("test")}
                className="w-full bg-[#14b53a] hover:bg-[#0f8c2c] text-white py-4 rounded-lg font-semibold text-lg transition text-left px-6"
              >
                📝 Mode Test
                <p className="text-sm opacity-90 mt-1 font-normal">
                  Répondez aux questions, la note s'affiche à la fin
                </p>
              </button>
              <button
                onClick={() => demarrerMode("revision")}
                className="w-full bg-[#fcd116] hover:bg-[#e6bc00] text-[#3e2723] py-4 rounded-lg font-semibold text-lg transition text-left px-6"
              >
                📚 Mode Révision
                <p className="text-sm opacity-80 mt-1 font-normal">
                  Voyez la bonne réponse après chaque question
                </p>
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ---------- RÉSULTAT ----------
  if (mode === "resultat") {
    return (
      <main className="min-h-screen bg-[#faf6ec] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#3e2723]/5 text-center">
            <div className="text-6xl mb-4">
              {nbBonnesReponses === quiz.questions.length
                ? "🏆"
                : nbBonnesReponses >= quiz.questions.length / 2
                ? "✅"
                : "📖"}
            </div>
            <h1 className="titre-kalan text-4xl font-bold text-[#14532d] mb-2">
              Quiz terminé !
            </h1>
            <p className="text-[#3e2723]/70 mb-8">
              Vous avez répondu à toutes les questions
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#14b53a] text-white rounded-xl p-6">
                <p className="text-sm opacity-90">Note</p>
                <p className="text-4xl font-bold">{note20}/20</p>
              </div>
              <div className="bg-white border-2 border-[#3e2723]/10 rounded-xl p-6">
                <p className="text-sm text-[#3e2723]/60">Bonnes réponses</p>
                <p className="text-4xl font-bold text-[#14532d]">
                  {nbBonnesReponses}/{quiz.questions.length}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-left mb-6 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-[#14532d] mb-3">
                Récapitulatif :
              </h3>
              {quiz.questions.map((q, i) => {
                const rep = reponses[i];
                const correct = rep === q.reponse;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      correct
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {correct ? "✅" : "❌"} Question {i + 1}
                    </p>
                    <p className="text-xs text-[#3e2723]/80">{q.question}</p>
                    <p className="text-xs text-[#3e2723]/60 mt-1">
                      Bonne réponse : {q.options[q.reponse]}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => demarrerMode("test")}
                className="flex-1 bg-[#14b53a] hover:bg-[#0f8c2c] text-white py-3 rounded-lg font-semibold transition"
              >
                🔄 Recommencer
              </button>
              <Link
                href="/quiz"
                className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg font-semibold transition text-center"
              >
                Retour aux quiz
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ---------- TEST / RÉVISION ----------
  const estRevision = mode === "revision";
  const aDejaRepondu = reponses[indexQuestion] !== undefined;

  return (
    <main className="min-h-screen bg-[#faf6ec] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setMode("menu")}
            className="text-sm text-[#3e2723]/60 hover:text-[#3e2723]"
          >
            ← Menu
          </button>
          <span className="text-sm text-[#3e2723]/60">
            {estRevision ? "📚 Révision" : "📝 Test"} · Question{" "}
            {indexQuestion + 1}/{quiz.questions.length}
          </span>
        </div>

        {/* Barre de progression */}
        <div className="h-2 bg-[#3e2723]/10 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-[#14b53a] transition-all duration-300"
            style={{
              width: `${((indexQuestion + 1) / quiz.questions.length) * 100}%`,
            }}
          />
        </div>

        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#3e2723]/5">
          <h2 className="text-xl md:text-2xl font-bold text-[#14532d] mb-6 leading-snug">
            {questionActuelle.question}
          </h2>

          <div className="space-y-2 mb-6">
            {questionActuelle.options.map((opt, i) => {
              const estSelectionnee = reponseSelectionnee === i;
              const estCorrecte = i === questionActuelle.reponse;
              const montrerResultat = aValide || (estRevision && aDejaRepondu);

              let classe =
                "w-full text-left p-4 rounded-lg border-2 transition font-medium ";
              if (montrerResultat) {
                if (estCorrecte) {
                  classe += "bg-green-50 border-green-500 text-green-900";
                } else if (estSelectionnee) {
                  classe += "bg-red-50 border-red-500 text-red-900";
                } else {
                  classe += "bg-gray-50 border-gray-200 text-gray-500";
                }
              } else if (estSelectionnee) {
                classe += "bg-[#14b53a]/10 border-[#14b53a]";
              } else {
                classe +=
                  "bg-white border-[#3e2723]/10 hover:border-[#14b53a] cursor-pointer";
              }

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (!montrerResultat) setReponseSelectionnee(i);
                  }}
                  disabled={montrerResultat}
                  className={classe}
                >
                  <span className="font-bold mr-2">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                  {montrerResultat && estCorrecte && (
                    <span className="ml-2">✅</span>
                  )}
                  {montrerResultat && estSelectionnee && !estCorrecte && (
                    <span className="ml-2">❌</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explication en mode révision */}
          {(estRevision && aValide) && (
            <div className="bg-[#fcd116]/20 border-l-4 border-[#fcd116] rounded-r-lg p-4 mb-6">
              <p className="text-sm font-semibold text-[#3e2723] mb-1">
                💡 Explication :
              </p>
              <p className="text-sm text-[#3e2723]/80">
                {questionActuelle.explication}
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-2 flex-wrap">
            {indexQuestion > 0 && (
              <button
                onClick={questionPrecedente}
                className="px-4 py-3 rounded-lg font-semibold bg-gray-200 text-[#3e2723] hover:bg-gray-300 transition"
              >
                ← Précédent
              </button>
            )}

            {!aValide && !estRevision && (
              <button
                onClick={validerReponse}
                disabled={reponseSelectionnee === null}
                className="flex-1 bg-[#14b53a] hover:bg-[#0f8c2c] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                Valider
              </button>
            )}

            {(aValide || estRevision) && (
              <button
                onClick={questionSuivante}
                className="flex-1 bg-[#14b53a] hover:bg-[#0f8c2c] text-white py-3 rounded-lg font-semibold transition"
              >
                {indexQuestion === quiz.questions.length - 1
                  ? "Voir les résultats"
                  : "Suivant →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}