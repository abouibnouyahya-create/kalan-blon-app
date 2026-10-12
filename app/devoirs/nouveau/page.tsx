"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createClient } from "@/lib/supabase/client";
import EcranChargement from "@/app/components/EcranChargement";

export default function NouveauDevoir() {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] = useState("devoir_maison");
  const [classe, setClasse] = useState("10eme");
  const [serie, setSerie] = useState("commune");
  const [discipline, setDiscipline] = useState("Mathematiques");
  const [theme, setTheme] = useState("");
  const [duree, setDuree] = useState("");

  const [sujet, setSujet] = useState("");
  const [corrige, setCorrige] = useState("");
  const [chargement, setChargement] = useState(false);
  const [chargementCorrige, setChargementCorrige] = useState(false);
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
        }),
      });

      const data = await reponse.json();
      setSujet(data.sujet);
      setModeAffichage("sujet");
    } catch (e) {
      setSujet("Erreur lors de la génération.");
    }
    setChargement(false);
  }

  async function genererCorrige() {
    if (!sujet) return;
    setChargementCorrige(true);

    try {
      const reponse = await fetch("/api/generate-corrige", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sujet, discipline }),
      });

      const data = await reponse.json();
      setCorrige(data.corrige || "");
      setModeAffichage("corrige");
    } catch (e) {
      alert("Erreur lors de la génération du corrigé.");
    }
    setChargementCorrige(false);
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
        avec_corrige: corrige !== "",
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
    const titreDoc = modeAffichage === "sujet" ? "Sujet" : "Corrige";

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
      <EcranChargement message="Chargement de Kalan Blon…" dureeEstimee={3} />
    );
  }

  if (chargement) {
    return (
      <EcranChargement
        message="Génération du sujet en cours…"
        dureeEstimee={30}
      />
    );
  }

  if (chargementCorrige) {
    return (
      <EcranChargement
        message="Génération du corrigé en cours…"
        dureeEstimee={40}
      />
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
                <option value="S