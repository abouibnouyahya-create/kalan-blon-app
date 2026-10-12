"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createClient } from "@/lib/supabase/client";

type Devoir = {
  id: number;
  created_at: string;
  type: string;
  classe: string;
  serie: string | null;
  discipline: string;
  theme: string;
  contenu: string;
  corrige: string | null;
  avec_corrige: boolean;
};

export default function DetailDevoir() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;

  const [devoir, setDevoir] = useState<Devoir | null>(null);
  const [chargement, setChargement] = useState(true);
  const [modeAffichage, setModeAffichage] = useState<"sujet" | "corrige">("sujet");

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
        .from("devoirs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        alert("Devoir introuvable");
        router.push("/devoirs");
        return;
      }
      setDevoir(data);
      setChargement(false);
    }
    charger();
  }, [id, router, supabase]);

  function copier() {
    if (!devoir) return;
    const contenu = modeAffichage === "sujet" ? devoir.contenu : devoir.corrige || "";
    navigator.clipboard.writeText(contenu);
    alert("Copié !");
  }

  function imprimer() {
    window.print();
  }

  function libelleType(type: string) {
    switch (type) {
      case "devoir_maison": return "Devoir à la maison";
      case "evaluation": return "Évaluation formative";
      case "devoir_surveille": return "Devoir surveillé";
      case "sujet_examen": return "Sujet d'examen";
      default: return "Devoir";
    }
  }

  if (chargement) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf6ec]">
        <p className="text-[#3e2723]/60 citation-kalan text-lg">Chargement…</p>
      </main>
    );
  }

  if (!devoir) return null;

  const contenuAffiche =
    modeAffichage === "sujet" ? devoir.contenu : devoir.corrige || "";

  return (
    <main className="min-h-screen flex relative bg-[#faf6ec]">
      <div className="bande-tricolore w-2 md:w-3 h-screen fixed left-0 top-0 z-10" />

      <div className="flex-1 ml-2 md:ml-3 motif-bogolan">
        <nav className="border-b border-[#3e2723]/10 bg-white/60 backdrop-blur-sm print:hidden">
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
              <Link href="/cours" className="font-medium hover:text-[#14b53a]">
                Fiches
              </Link>
              <Link href="/devoirs" className="font-medium text-[#14b53a]">
                Devoirs
              </Link>
              <Link
                href="/devoirs/nouveau"
                className="bg-[#14b53a] hover:bg-[#0f8c2c] text-white px-4 py-2 rounded-lg font-medium transition"
              >
                + Créer
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="print:hidden mb-6">
            <Link
              href="/devoirs"
              className="text-sm text-[#3e2723]/60 hover:text-[#3e2723]"
            >
              ← Retour à mes devoirs
            </Link>
          </div>

          <div className="mb-8 print:mb-4">
            <p className="text-xs uppercase tracking-widest text-[#14b53a] font-bold mb-2">
              {libelleType(devoir.type)}
            </p>
            <h1 className="titre-kalan text-4xl font-bold text-[#14532d] mb-2">
              {devoir.theme}
            </h1>
            <p className="text-[#3e2723]/60 text-sm">
              {devoir.discipline} · {devoir.classe}
              {devoir.serie && devoir.serie !== "commune"
                ? ` (${devoir.serie})`
                : ""}
            </p>
          </div>

          {devoir.corrige && (
            <div className="flex gap-2 mb-6 print:hidden">
              <button
                onClick={() => setModeAffichage("sujet")}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  modeAffichage === "sujet"
                    ? "bg-[#14b53a] text-white"
                    : "bg-white text-[#3e2723] border-2 border-[#3e2723]/10"
                }`}
              >
                📄 Sujet
              </button>
              <button
                onClick={() => setModeAffichage("corrige")}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  modeAffichage === "corrige"
                    ? "bg-[#14b53a] text-white"
                    : "bg-white text-[#3e2723] border-2 border-[#3e2723]/10"
                }`}
              >
                ✅ Corrigé
              </button>
            </div>
          )}

          <div className="flex gap-2 mb-6 print:hidden flex-wrap">
            <button
              onClick={copier}
              className="flex-1 min-w-[150px] bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              📋 Copier
            </button>
            <button
              onClick={imprimer}
              className="flex-1 min-w-[150px] bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
            >
              🖨️ Imprimer
            </button>
          </div>

          <div className="bg-white p-8 rounded-lg shadow print:shadow-none print:p-0">
            <article className="max-w-none text-gray-800 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {contenuAffiche}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      </div>
    </main>
  );
}