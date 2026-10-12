export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function attendre(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function genererAvecRetry(prompt: string) {
  const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY || "missing-key",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });

  const modeles = [
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
  ];

  let derniereErreur: unknown = null;

  for (const modele of modeles) {
    for (let tentative = 1; tentative <= 2; tentative++) {
      try {
        const completion = await openai.chat.completions.create({
          model: modele,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });
        const contenu = completion.choices[0].message.content || "";
        if (contenu) return contenu;
      } catch (err: unknown) {
        derniereErreur = err;
        const code =
          (err as { status?: number })?.status ||
          (err as { response?: { status?: number } })?.response?.status;
        if (code === 503 || code === 429 || code === 500) {
          await attendre(tentative * 2000);
        } else {
          break;
        }
      }
    }
  }
  throw derniereErreur || new Error("Tous les modèles ont échoué");
}

export async function POST(req: NextRequest) {
  try {
    const { type, classe, serie, discipline, theme, duree } = await req.json();

    const typeLabels: Record<string, string> = {
      devoir_maison: "Devoir à la maison",
      evaluation: "Évaluation formative",
      devoir_surveille: "Devoir surveillé",
      sujet_examen: "Sujet d'examen (type composition)",
    };

    const typeLigne = typeLabels[type] || "Devoir";

    const disciplineLower = discipline.toLowerCase();
    let langueContenu = "français";
    let consigneLangue = "Toute la fiche doit être rédigée EN FRANÇAIS.";

    if (disciplineLower.includes("anglais")) {
      langueContenu = "anglais";
      consigneLangue = `Toute la fiche doit être rédigée EN ANGLAIS, sauf :
- L'en-tête administratif (République du Mali, Ministère, Établissement, Classe, Durée)
- Le mot "Nom :" et "Date :" pour que l'élève s'identifie
Tout le reste (consignes, exercices, questions) doit être EN ANGLAIS.`;
    } else if (disciplineLower.includes("arabe")) {
      langueContenu = "arabe";
      consigneLangue =
        "Toute la fiche doit être rédigée EN ARABE, sauf l'en-tête administratif.";
    }

    const dureeRecommandee =
      type === "evaluation"
        ? "30 minutes"
        : type === "devoir_maison"
        ? "à faire à la maison"
        : duree || "1 heure";

    const nbExercices =
      type === "evaluation"
        ? "2 à 3"
        : type === "devoir_maison"
        ? "3 à 4"
        : type === "devoir_surveille"
        ? "3 à 4"
        : "4 à 5";

    const prompt = `Tu es un expert en évaluation pédagogique selon l'Approche Par Compétences (APC) du système éducatif malien.

Génère un sujet complet de type : **${typeLigne}**

Paramètres :
- Classe : ${classe}
- Série : ${serie}
- Discipline : ${discipline}
- Thème : ${theme}
- Durée : ${dureeRecommandee}
- Nombre d'exercices : ${nbExercices}
- Barème total : 20 points (barème détaillé par question)

⚠️ RÈGLE DE LANGUE :
${consigneLangue}

STRUCTURE OBLIGATOIRE (Markdown) :

# RÉPUBLIQUE DU MALI
## Ministère de l'Éducation Nationale
### Lycée Public de Bamako

---

## ${typeLigne.toUpperCase()} N°___

**Discipline :** ${discipline}
**Classe :** ${classe}${serie && serie !== "commune" ? ` (${serie})` : ""}
**Durée :** ${dureeRecommandee}
**Date :** ____ / ____ / 2026

**Nom et Prénom :** ______________________________
**Classe :** ____________

---

### EXERCICE 1 — [Titre de l'exercice] ([X] points)

[Énoncé clair et progressif]

1. [Question 1] ([X] pt)
2. [Question 2] ([X] pts)
...

### EXERCICE 2 — [Titre de l'exercice] ([X] points)
...

---

**TOTAL : 20 POINTS**

---

## CONSIGNES POUR L'ENSEIGNANT

- Durée conseillée : ${dureeRecommandee}
- Matériel autorisé : calculatrice (pour les maths), dictionnaire (pour les langues), aucun autre document
- Compétences évaluées : [liste]
- Remarques : [difficultés anticipées des élèves]

---

CONSIGNES STRICTES :

1. Les exercices doivent être progressifs (facile → difficile)
2. Le barème doit être CLAIR et DÉTAILLÉ par question
3. Les exercices doivent être ancrés dans le CONTEXTE MALIEN (noms maliens : Aminata, Boubacar, Moussa, Fatoumata, etc. ; situations locales : marché, agriculture, transport, école, famille...)
4. Utilise un langage simple, adapté au niveau ${classe}
5. Le sujet doit être prêt à imprimer tel quel

⚠️ RÈGLE DE FORMATAGE TRÈS IMPORTANTE :
6. **N'utilise JAMAIS de tableaux Markdown (avec des | et des ---).** Ils s'affichent mal dans notre application.
   À la place, utilise des LISTES NUMÉROTÉES ou des TIRETS.

7. Pour les exercices à remplir par l'élève, utilise des POINTILLÉS :
   - ______ (pour les réponses courtes)
   - ................................................................ (pour les phrases complètes)
   - ☐ (pour les cases à cocher)

8. Structure chaque exercice ainsi :
   - Titre de l'exercice (avec le barème entre parenthèses)
   - Consigne claire
   - Liste des questions numérotées avec les points entre parenthèses

9. N'utilise PAS de symboles Markdown exotiques (---, ===, etc.) — reste simple.`;

    const sujet = await genererAvecRetry(prompt);

    // Le corrigé sera généré séparément via /api/generate-corrige
    return NextResponse.json({ sujet, corrige: "" });
  } catch (error: unknown) {
    console.error("ERREUR:", error);
    return NextResponse.json(
      {
        sujet:
          "Erreur lors de la génération. Réessayez dans quelques instants.",
        corrige: "",
      },
      { status: 500 }
    );
  }
}