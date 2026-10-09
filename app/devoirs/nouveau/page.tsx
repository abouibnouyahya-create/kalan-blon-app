"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";

export default function NouveauDevoir() {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] = useState("devoir_maison");
  const [classe, setClasse] = useState("10eme");
  const [serie, setSerie] = useState("commune");
  const [discipline, setDiscipline] = useState("Mathematiques");
  const [theme, setTheme] = useState("");
  const [duree, setDuree] = useState("");
  const [avecCorrige, setAvecCorrige] = useState(true);

  const [sujet, setSujet] = useState("");
  const [corrige, setCorrige] = useState("");
  const [chargement, setChargement] = useState(false);
  const [verif, setVerif] = useState(true);
  const [modeAffichage, setModeAffichage] = useState<"sujet" | "corrige">("sujet");

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
    if (!theme) {
      alert("Remplis le thème");
      return;
    }
    setChargement(true);
    setSujet("");
    setCorrige("");

    try {
      const reponse = await fetch("/api/generate-devoir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          classe,
          serie,
          discipline,
          theme,
          duree,
          avecCorrige,
        }),
      });

      const data = await reponse.json();
      setSujet(data.sujet);
      setCorrige(data.corrige || "");
      setModeAffichage("sujet");
    } catch (e) {
      setSujet("Erreur lors de la génération.");
    }
    setChargement(false);
  }

  async function sauvegarder() {
    if (!sujet) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Vous devez être connecté.");
      return;
    }

    const { error } = await supabase.from("devoirs").insert([
      {
        user_id: user.id,
        type,
        classe,
        serie,
        discipline,
        theme,
        duree,
        contenu: sujet,
        corrige,
        avec_corrige: avecCorrige && corrige !== "",
      },
    ]);

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      alert("Devoir sauvegardé !");
    }
  }

  function copier() {
    const texte = modeAffichage === "sujet" ? sujet : corrige;
    navigator.clipboard.writeText(texte);
    alert("Copié !");
  }

  function imprimer() {
    window.print();
  }

  async function telechargerWord() {
    const contenu = modeAffichage === "sujet" ? sujet : corrige;
    const titreDoc = modeAffichage === "sujet" ? "Sujet" : "Corrigé";

    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import(
      "docx"
    );

    const lignes = contenu.split("\n");
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
    a.download = `${titreDoc}-${theme.replace(/\s+/g, "-")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (verif) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf6ec]">
        <p className="text-[#3e2723]/60 citation-kalan text-lg">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf6ec] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="titre-kalan text-4xl font-bold text-[#14532d] mb-6 print:hidden">
          Nouveau devoir / évaluation
        </h1>

        <div className="bg-white p-6 rounded-lg shadow space-y-4 print:hidden">
          <div>
            <label className="block font-semibold mb-2">Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { v: "devoir_maison", l: "📝 Devoir maison" },
                { v: "evaluation", l: "📊 Évaluation" },
                { v: "devoir_surveille", l: "📋 Devoir surveillé" },
                { v: "sujet_examen", l: "🎓 Sujet d'examen" },
              ].map((t) => (
                <button
                  key={t.v}
                  onClick={() => setType(t.v)}
                  className={`py-3 rounded-lg text-sm font-semibold border-2 transition ${
                    type === t.v
                      ? "bg-[#14b53a] text-white border-[#14b53a]"
                      : "bg-white border-[#3e2723]/10 hover:border-[#14b53a]/50"
                  }`}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>

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
              <label className="block font-semibold mb-1">
                Durée (optionnel)
              </label>
              <input
                type="text"
                value={duree}
                onChange={(e) => setDuree(e.target.value)}
                placeholder="Ex : 1 heure"
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Thème / Chapitre</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex : Le présent simple en anglais"
              className="w-full border rounded p-2"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={avecCorrige}
              onChange={(e) => setAvecCorrige(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="font-medium">
              Générer aussi le corrigé (recommandé)
            </span>
          </label>

          <button
            onClick={generer}
            disabled={chargement}
            className="w-full bg-[#14b53a] hover:bg-[#0f8c2c] text-white py-3 rounded-lg font-semibold text-lg transition disabled:opacity-50"
          >
            {chargement ? "Génération en cours..." : "🎯 Générer le sujet"}
          </button>
        </div>

        {sujet && (
          <>
            {/* Onglets Ssj/Corrigé */}
            {corrige && (
              <div className="flex gap-2 mt-6 print:hidden">
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

            <div className="flex gap-2 mt-4 print:hidden flex-wrap">
              <button
                onClick={sauvegarder}
                className="flex-1 min-w-[150px] bg-[#fcd116] text-[#3e2723] py-3 rounded-lg font-semibold hover:bg-[#e6bc00] transition"
              >
                💾 Sauvegarder
              </button>
              <button
                onClick={copier}
                className="flex-1 min-w-[150px] bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                📋 Copier
              </button>
              <button
                onClick={telechargerWord}
                className="flex-1 min-w-[150px] bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                📄 Word
              </button>
              <button
                onClick={imprimer}
                className="flex-1 min-w-[150px] bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
              >
                🖨️ Imprimer
              </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow mt-6 print:shadow-none print:p-0">
              <article className="max-w-none text-gray-800 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {modeAffichage === "sujet" ? sujet : corrige}
                </ReactMarkdown>
              </article>
            </div>
          </>
        )}
      </div>
    </main>
  );
}