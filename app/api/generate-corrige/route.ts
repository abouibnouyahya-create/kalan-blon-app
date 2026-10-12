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
    const { sujet, discipline } = await req.json();

    if (!sujet) {
      return NextResponse.json(
        { corrige: "Aucun sujet fourni." },
        { status: 400 }
      );
    }

    const disciplineLower = (discipline || "").toLowerCase();
    let langueContenu = "français";
    if (disciplineLower.includes("anglais")) {
      langueContenu = "anglais";
    } else if (disciplineLower.includes("arabe")) {
      langueContenu = "arabe";
    }

    const prompt = `Voici un sujet d'évaluation :

${sujet}

Génère le CORRIGÉ COMPLET de ce sujet, avec :
- Réponses détaillées à chaque question
- Barème appliqué question par question
- Commentaires pédagogiques pour l'enseignant

⚠️ RÈGLES :
- N'utilise PAS de tableaux Markdown (avec des | et ---)
- Utilise des listes numérotées ou des tirets
- Format Markdown simple
- Langue : ${langueContenu}

Format attendu :
# CORRIGÉ — [Titre du sujet]

## EXERCICE 1 ([X] points)

### Question 1 ([X] pt)
**Réponse attendue :** ...
**Commentaire pédagogique :** ...

### Question 2 ([X] pts)
...

## EXERCICE 2 ([X] points)
...`;

    const corrige = await genererAvecRetry(prompt);

    return NextResponse.json({ corrige });
  } catch (error: unknown) {
    console.error("ERREUR:", error);
    return NextResponse.json(
      { corrige: "Erreur lors de la génération du corrigé. Réessayez." },
      { status: 500 }
    );
  }
}