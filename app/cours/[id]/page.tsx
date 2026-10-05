"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";

type Fiche = {
  id: number;
  created_at: string;
  theme: string;
  discipline: string | null;
  classe: string | null;
  serie: string | null;
  duree: string | null;
  contenu: string;
};

export default function DetailFiche() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;

  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [chargement, setChargement] = useState(true);
  const [modeEdition, setModeEdition] = useState(false);
  const [contenuEdite, setContenuEdite] = useState("");
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);

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
        .from("fiches")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        alert("Fiche introuvable");
        router.push("/cours");
        return;
      }
      setFiche(data);
      setContenuEdite(data.contenu);
      setChargement(false);
    }
    charger();
  }, [id, router, supabase]);

  async function sauvegarderEdition() {
    if (!fiche) return;
    setSauvegardeEnCours(true);

    const { error } = await supabase
      .from("fiches")
      .update({ contenu: contenuEdite })
      .eq("id", fiche.id);

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      setFiche({ ...fiche, contenu: contenuEdite });
      setModeEdition(false);
      alert("Fiche mise à jour !");
    }
    setSauvegardeEnCours(false);
  }

  function annulerEdition() {
    if (!fiche) return;
    setContenuEdite(fiche.contenu);
    setModeEdition(false);
  }

  function copier() {
    if (!fiche) return;
    navigator.clipboard.writeText(fiche.contenu);
    alert("Fiche copiée !");
  }

  function imprimer() {
    window.print();
  }

  async function telechargerWord() {
    if (!fiche) return;
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import(
      "docx"
    );

    const lignes = fiche.contenu.split("\n");
    const paragraphes: any[] = [];

    function texteEnRuns(texte: string): any[] {
      const morceaux = texte.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
      return morceaux
        .filter((m) => m !== "")
        .map((m) => {
          if (m.startsWith("**") && m.endsWith("**")) {
            return new TextRun({ text: m.slice(2, -2), bold: true });
          }
          if (m.startsWith("*") && m.endsWith("*") && m.length > 2) {
            return new TextRun({ text: m.slice(1, -1), italics: true });
          }
          return new TextRun({ text: m });
        });
    }

    for (const ligne of lignes) {
      const texte = ligne.trim();
      if (!texte) {
        paragraphes.push(new Paragraph({ text: "" }));
        continue;
      }
      if (texte.startsWith("# ")) {
        paragraphes.push(
          new Paragraph({
            text: texte.replace(/^#\s+/, ""),
            heading: HeadingLevel.HEADING_1,
          })
        );
      } else if (texte.startsWith("## ")) {
        paragraphes.push(
          new Paragraph({
            text: texte.replace(/^##\s+/, ""),
            heading: HeadingLevel.HEADING_2,
          })
        );
      } else if (texte.startsWith("### ")) {
        paragraphes.push(
          new Paragraph({
            text: texte.replace(/^###\s+/, ""),
            heading: HeadingLevel.HEADING_3,
          })
        );
      } else if (texte.startsWith("#### ")) {
        paragraphes.push(
          new Paragraph({
            text: texte.replace(/^####\s+/, ""),
            heading: HeadingLevel.HEADING_4,
          })
        );
      } else if (texte === "---") {
        paragraphes.push(new Paragraph({ text: "" }));
      } else if (texte.startsWith("* ") || texte.startsWith("- ")) {
        const contenuListe = texte.replace(/^[*\-]\s+/, "");
        paragraphes.push(
          new Paragraph({
            children: texteEnRuns(contenuListe),
            bullet: { level: 0 },
          })
        );
      } else {
        paragraphes.push(new Paragraph({ children: texteEnRuns(texte) }));
      }
    }

    const doc = new Document({ sections: [{ children: paragraphes }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fiche-APC-${fiche.theme.replace(/\s+/g, "-")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (chargement) {
    return (
      <main className="min-h-screen flex relative bg-[#faf6ec]">
        <div className="bande-tricolore w-2 md:w-3 h-screen fixed left-0 top-0 z-10" />
        <div className="flex-1 ml-2 md:ml-3 flex items-center justify-center">
          <p className="text-[#3e2723]/60 citation-kalan text-lg">
            Chargement de la fiche…
          </p>
        </div>
      </main>
    );
  }

  if (!fiche) return null;

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
              <Link
                href="/accueil"
                className="font-medium hover:text-[#14b53a]"
              >
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
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="print:hidden mb-6">
            <Link
              href="/cours"
              className="text-sm text-[#3e2723]/60 hover:text-[#3e2723]"
            >
              ← Retour à mes fiches
            </Link>
          </div>

          <div className="mb-8 print:mb-4">
            <h1 className="titre-kalan text-4xl font-bold text-[#14532d] mb-2">
              {fiche.theme}
            </h1>
            <p className="text-[#3e2723]/60 text-sm">
              {fiche.discipline} · {fiche.classe}
              {fiche.serie && fiche.serie !== "commune"
                ? ` (${fiche.serie})`
                : ""}{" "}
              · {fiche.duree} min
            </p>
          </div>

          {!modeEdition && (
            <div className="flex gap-2 mb-6 print:hidden flex-wrap">
              <button
                onClick={() => setModeEdition(true)}
                className="flex-1 min-w-[130px] bg-[#fcd116] text-[#3e2723] py-3 rounded-lg font-semibold hover:bg-[#e6bc00] transition"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={copier}
                className="flex-1 min-w-[130px] bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                📋 Copier
              </button>
              <button
                onClick={telechargerWord}
                className="flex-1 min-w-[130px] bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
              >
                📄 Word
              </button>
              <button
                onClick={imprimer}
                className="flex-1 min-w-[130px] bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
              >
                🖨️ Imprimer
              </button>
            </div>
          )}

          {modeEdition && (
            <div className="flex gap-2 mb-6 print:hidden flex-wrap">
              <button
                onClick={sauvegarderEdition}
                disabled={sauvegardeEnCours}
                className="flex-1 min-w-[180px] bg-[#14b53a] text-white py-3 rounded-lg font-semibold hover:bg-[#0f8c2c] disabled:opacity-50"
              >
                {sauvegardeEnCours ? "Sauvegarde…" : "💾 Sauvegarder"}
              </button>
              <button
                onClick={annulerEdition}
                className="flex-1 min-w-[180px] bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-gray-500"
              >
                ✖ Annuler
              </button>
            </div>
          )}

          <div className="bg-white p-8 rounded-lg shadow print:shadow-none print:p-0">
            {modeEdition ? (
              <textarea
                value={contenuEdite}
                onChange={(e) => setContenuEdite(e.target.value)}
                className="w-full min-h-[600px] p-4 border-2 border-[#3e2723]/10 rounded-lg font-mono text-sm focus:border-[#14b53a] focus:outline-none resize-y"
                spellCheck="false"
              />
            ) : (
              <article className="max-w-none text-gray-800 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {fiche.contenu}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}