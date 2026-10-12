"use client";

import { useEffect, useState } from "react";

type Citation = {
  texte: string;
  auteur: string;
};

const CITATIONS: Citation[] = [
  {
    texte:
      "L'éducation est l'arme la plus puissante qu'on puisse utiliser pour changer le monde.",
    auteur: "Nelson Mandela",
  },
  {
    texte:
      "Un enfant qui lit sera un adulte qui pense.",
    auteur: "Proverbe africain",
  },
  {
    texte:
      "L'école est la lumière qui éclaire le chemin de la nation.",
    auteur: "Sagesse malienne",
  },
  {
    texte:
      "Éduquer un enfant, c'est préparer l'avenir de tout un peuple.",
    auteur: "Proverbe bambara",
  },
  {
    texte:
      "Le savoir est une porte que seul l'effort ouvre.",
    auteur: "Proverbe bambara",
  },
  {
    texte:
      "Il faut tout un village pour élever un enfant.",
    auteur: "Proverbe africain",
  },
  {
    texte:
      "L'enseignement est le plus grand acte d'amour envers les générations futures.",
    auteur: "Inconnu",
  },
  {
    texte:
      "C'est en apprenant que l'enfant devient un homme debout.",
    auteur: "Sagesse africaine",
  },
  {
    texte:
      "La connaissance est un trésor qui suit son propriétaire partout.",
    auteur: "Proverbe africain",
  },
  {
    texte:
      "Le vrai maître est celui qui donne envie d'apprendre.",
    auteur: "Inconnu",
  },
  {
    texte:
      "Chaque enfant que tu enseignes est un futur qui te remercie.",
    auteur: "Sagesse malienne",
  },
  {
    texte:
      "La patience est le pain de l'enseignant.",
    auteur: "Proverbe bambara",
  },
];

type Props = {
  message?: string;
  dureeEstimee?: number;
};

export default function EcranChargement({
  message = "Génération en cours…",
  dureeEstimee = 30,
}: Props) {
  const [citationIndex, setCitationIndex] = useState(0);
  const [secondes, setSecondes] = useState(0);

  // Change la citation toutes les 6 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCitationIndex((prev) => (prev + 1) % CITATIONS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Compteur de secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondes((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const citation = CITATIONS[citationIndex];
  const pourcentage = Math.min(95, (secondes / dureeEstimee) * 100);

  return (
    <main className="min-h-screen flex relative overflow-hidden bg-[#faf6ec]">
      <div className="bande-tricolore w-2 md:w-3 h-screen fixed left-0 top-0 z-10" />
      <div className="absolute inset-0 motif-bogolan pointer-events-none" />

      {/* Cercles animés de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#14b53a]/5 animate-pulse-slow" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-[#fcd116]/5 animate-pulse-slow-delayed" />
        <div className="absolute -bottom-32 left-1/4 w-72 h-72 rounded-full bg-[#ce1126]/5 animate-pulse-slow" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 ml-2 md:ml-3 relative z-0 py-16">
        <div className="max-w-2xl w-full text-center">
          {/* Spinner principal */}
          <div className="flex justify-center mb-10">
            <div className="relative w-24 h-24">
              {/* Cercle extérieur */}
              <div className="absolute inset-0 rounded-full border-4 border-[#14b53a]/20" />
              {/* Cercle animé */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#14b53a] border-r-[#14b53a] animate-spin" />
              {/* Livre au centre */}
              <div className="absolute inset-0 flex items-center justify-center text-4xl">
                📖
              </div>
            </div>
          </div>

          {/* Message principal */}
          <h1 className="titre-kalan text-3xl md:text-4xl font-bold text-[#14532d] mb-3">
            {message}
          </h1>

          {/* Compteur */}
          <p className="text-[#3e2723]/60 mb-6">
            ⏱️ {secondes} seconde{secondes > 1 ? "s" : ""} écoulée
            {secondes > 1 ? "s" : ""}
          </p>

          {/* Barre de progression */}
          <div className="w-full max-w-md mx-auto mb-12">
            <div className="h-2 bg-[#3e2723]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#14b53a] to-[#0f8c2c] transition-all duration-1000 rounded-full"
                style={{ width: `${pourcentage}%` }}
              />
            </div>
            <p className="text-xs text-[#3e2723]/50 mt-2">
              Le saviez-vous ? L'IA prend en moyenne {dureeEstimee} secondes
              pour produire un contenu de qualité.
            </p>
          </div>

          {/* Citation animée */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 md:p-10 shadow-lg border border-[#3e2723]/5 min-h-[200px] flex flex-col justify-center transition-all duration-500">
            <div className="text-5xl text-[#14b53a]/30 mb-4 font-serif">
              «
            </div>
            <p
              key={citationIndex}
              className="citation-kalan text-xl md:text-2xl text-[#3e2723] leading-relaxed mb-4 animate-fade-in"
            >
              {citation.texte}
            </p>
            <p className="text-sm text-[#14b53a] font-semibold tracking-widest uppercase">
              — {citation.auteur}
            </p>
            <div className="text-5xl text-[#14b53a]/30 mt-2 font-serif self-end">
              »
            </div>
          </div>

          {/* Indicateurs de citation */}
          <div className="flex justify-center gap-2 mt-6">
            {CITATIONS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === citationIndex
                    ? "w-8 bg-[#14b53a]"
                    : "w-1.5 bg-[#3e2723]/20"
                }`}
              />
            ))}
          </div>

          {/* Message de patience */}
          <p className="text-sm text-[#3e2723]/50 mt-8 citation-kalan">
            Patience… le savoir prend le temps de se construire.
          </p>
        </div>
      </div>

      {/* Styles d'animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        .animate-pulse-slow-delayed {
          animation: pulse-slow 8s ease-in-out infinite 2s;
        }
      `}</style>
    </main>
  );
}