"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";

export default function NouveauCours() {
  const router = useRouter();
  const supabase = createClient();

  const [classe, setClasse] = useState("10eme");
  const [serie, setSerie] = useState("commune");
  const [discipline, setDiscipline] = useState("Mathematiques");
  const [theme, setTheme] = useState("");
  const [duree, setDuree] = useState("55");
  const [resultat, setResultat] = useState("");
  const [chargement, setChargement] = useState(false);

  async function generer() {
    if (!theme) {
      alert("Remplis le thème du cours");
      return;
    }
    setChargement(true);
    setResultat("");

    try {
      const reponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classe, serie, discipline, theme, duree }),
      });

      const data = await reponse.json();
      setResultat(data.contenu);
    } catch (e) {
      setResultat("Erreur lors de la génération.");
    }
    setChargement(false);
  }

  function copier() {
    navigator.clipboard.writeText(resultat);
    alert("Fiche copiée ! Colle-la dans Word.");
  }

  function imprimer() {
    window.print();
  }

  async function sauvegarder() {
    if (!resultat) {
      alert("Aucune fiche à sauvegarder.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Vous devez être connecté.");
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("fiches").insert([
      {
        theme,
        discipline,
        classe,
        serie,
        duree,
        contenu: resultat,
        user_id: user.id,
      },
    ]);

    if (error) {
      alert("Erreur lors de la sauvegarde : " + error.message);
    } else {
      alert("Fiche sauvegardée avec succès !");
    }
  }

  async function telechargerWord() {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import(
      "docx"
    );

    const lignes = resultat.split("\n");
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
      } else if (/^\d+\.\s+/.test(texte)) {
        const contenuListe = texte.replace(/^\d+\.\s+/, "");
        paragraphes.push(
          new Paragraph({
            children: texteEnRuns(contenuListe),
            numbering: { reference: "default-numbering", level: 0 },
          })
        );
      } else if (texte.startsWith("> ")) {
        const contenuCitation = texte.replace(/^>\s+/, "");
        paragraphes.push(
          new Paragraph({
            children: texteEnRuns(contenuCitation),
            indent: { left: 720 },
          })
        );
      } else {
        paragraphes.push(new Paragraph({ children: texteEnRuns(texte) }));
      }
    }

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: "default-numbering",
            levels: [
              {
                level: 0,
                format: "decimal",
                text: "%1.",
                alignment: "start",
              },
            ],
          },
        ],
      },
      sections: [{ children: paragraphes }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fiche-APC-${theme.replace(/\s+/g, "-")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800 mb-6 print:hidden">
          Nouvelle fiche de cours
        </h1>

        <div className="bg-white p-6 rounded-lg shadow space-y-4 print:hidden">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Classe</label>
              <select
                value={classe}
                onChange={(e) => setClasse(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="10eme">10ème année</option>
                <option value="11eme">11ème année</option>
                <option value="12eme">12ème (Terminale)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Série</label>
              <select
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="commune">Tronc commun</option>
                <option value="L">Littéraire (L)</option>
                <option value="SES">Sciences Éco. et Sociales</option>
                <option value="S">Scientifique (S)</option>
                <option value="TLL">TLL</option>
                <option value="TAL">TAL</option>
                <option value="TSS">TSS</option>
                <option value="TSEco">TSEco</option>
                <option value="TSExp">TSExp</option>
                <option value="TSE">TSE</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Discipline</label>
              <input
                type="text"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Durée (min)</label>
              <input
                type="number"
                value={duree}
                onChange={(e) => setDuree(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Thème du cours</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex : Les équations du second degré"
              className="w-full border rounded p-2"
            />
          </div>

          <button
            onClick={generer}
            disabled={chargement}
            className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50"
          >
            {chargement ? "Génération en cours..." : "Générer la fiche"}
          </button>
        </div>

        {resultat && (
          <>
            <div className="flex gap-2 mt-6 print:hidden flex-wrap">
              <button
                onClick={sauvegarder}
                className="flex-1 min-w-[150px] bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800"
              >
                💾 Sauvegarder
              </button>
              <button
                onClick={copier}
                className="flex-1 min-w-[150px] bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                📋 Copier
              </button>
              <button
                onClick={telechargerWord}
                className="flex-1 min-w-[150px] bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
              >
                📄 Word
              </button>
              <button
                onClick={imprimer}
                className="flex-1 min-w-[150px] bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
              >
                🖨️ Imprimer
              </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow mt-6 print:shadow-none print:p-0">
              <article className="max-w-none text-gray-800 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {resultat}
                </ReactMarkdown>
              </article>
            </div>
          </>
        )}
      </div>
    </main>
  );
}