"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BoutonInstallation from "@/app/components/BoutonInstallation";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nom, setNom] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState("");

  async function soumettre() {
    if (!email || !motDePasse) {
      alert("Remplis tous les champs obligatoires");
      return;
    }
    setChargement(true);
    setMessage("");

    if (mode === "inscription") {
      const { error } = await supabase.auth.signUp({
        email,
        password: motDePasse,
        options: {
          data: {
            nom: nom,
            etablissement: etablissement,
          },
        },
      });

      if (error) {
        setMessage("Erreur : " + error.message);
      } else {
        setMessage("Compte créé ! Redirection…");
        setTimeout(() => router.push("/accueil"), 1000);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: motDePasse,
      });

      if (error) {
        setMessage("Erreur : " + error.message);
      } else {
        setMessage("Connexion réussie ! Redirection…");
        setTimeout(() => router.push("/accueil"), 800);
      }
    }
    setChargement(false);
  }

  return (
    <main className="min-h-screen flex relative overflow-hidden bg-[#faf6ec]">
      <div className="bande-tricolore w-2 md:w-3 h-screen fixed left-0 top-0 z-10" />
      <div className="absolute inset-0 motif-bogolan pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-6 ml-2 md:ml-3 relative z-0 py-16">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="text-sm text-[#3e2723]/50 hover:text-[#3e2723]"
            >
              ← Retour au vestibule
            </Link>
          </div>

          <h1 className="titre-kalan text-4xl font-bold text-center mb-2 text-[#14532d]">
            {mode === "connexion" ? "Connexion" : "Créer un compte"}
          </h1>

          <p className="text-center text-[#3e2723]/70 mb-8 citation-kalan">
            {mode === "connexion"
              ? "Bon retour sur Kalan Blon"
              : "Rejoignez la porte du savoir"}
          </p>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-4 border border-[#3e2723]/5">
            {mode === "inscription" && (
              <>
                <div>
                  <label className="block font-semibold mb-2 text-[#3e2723]">
                    Votre nom
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex : Abdramane Yahya"
                    className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2 text-[#3e2723]">
                    Établissement{" "}
                    <span className="text-[#3e2723]/40 font-normal">
                      (optionnel)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={etablissement}
                    onChange={(e) => setEtablissement(e.target.value)}
                    placeholder="Ex : Lycée Public de Bamako"
                    className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block font-semibold mb-2 text-[#3e2723]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2 text-[#3e2723]">
                Mot de passe
              </label>
              <input
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="Au moins 6 caractères"
                onKeyDown={(e) => {
                  if (e.key === "Enter") soumettre();
                }}
                className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
              />
            </div>

            {message && (
              <p
                className={`text-sm p-3 rounded-lg ${
                  message.includes("Erreur")
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {message}
              </p>
            )}

            <button
              onClick={soumettre}
              disabled={chargement}
              className="w-full bg-[#14b53a] hover:bg-[#0f8c2c] text-white py-4 rounded-lg font-semibold text-lg shadow-md transition-all disabled:opacity-50"
            >
              {chargement
                ? "Chargement…"
                : mode === "connexion"
                ? "Se connecter"
                : "Créer mon compte"}
            </button>

            <div className="text-center pt-2">
              <button
                onClick={() =>
                  setMode(mode === "connexion" ? "inscription" : "connexion")
                }
                className="text-sm text-[#14b53a] hover:text-[#0f8c2c] font-medium"
              >
                {mode === "connexion"
                  ? "Pas encore de compte ? S'inscrire"
                  : "Déjà inscrit ? Se connecter"}
              </button>
            </div>
          </div>

          <p className="text-center citation-kalan text-[#3e2723]/40 text-sm mt-8">
            « Le savoir est une porte que seul l'effort ouvre »
          </p>
        </div>
      </div>

      <BoutonInstallation />
    </main>
  );
}