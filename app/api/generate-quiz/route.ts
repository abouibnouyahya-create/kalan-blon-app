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
          response_format: { type: "json_object" },
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
    const { classe, discipline, theme, difficulte, nbQuestions } =
      await req.json();

    const disciplineLower = discipline.toLowerCase();
    let langueContenu = "français";

    if (disciplineLower.includes("anglais")) {
      langueContenu = "anglais";
    } else if (disciplineLower.includes("arabe")) {
      langueContenu = "arabe";
    }

    const prompt = `Tu es un enseignant malien expert en évaluation. Génère un quiz de ${nbQuestions} questions.

PARAMÈTRES :
- Classe : ${classe}
- Discipline : ${discipline}
- Thème : ${theme}
- Difficulté : ${difficulte}
- Langue : ${langueContenu}
- Nombre de questions : ${nbQuestions}

🎯 RÈGLES DE CONTENU :

1. Niveau adapté : Un élève malien de ${classe}
2. Phrases COURTES (max 15 mots par question)
3. Vocabulaire SIMPLE, mots courants
4. Contexte 100% MALIEN : noms maliens (Aminata, Moussa, Boubacar, Fatoumata...), lieux maliens (Bamako, Ségou, fleuve Niger, marché...)
5. Éviter le vocabulaire universitaire
6. Difficulté "${difficulte}" :
   - facile : questions de base, vocabulaire direct
   - moyen : questions standards, réflexion simple
   - difficile : questions complexes, analyse

📋 FORMAT DE RÉPONSE (JSON STRICT) :

{
  "titre": "Quiz — [Titre court du thème]",
  "questions": [
    {
      "question": "[Question en max 15 mots]",
      "type": "qcm",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "reponse": 0,
      "explication": "[Explication simple, 1-2 phrases]"
    }
  ]
}

⚠️ RÈGLES DE FORMATAGE :

- "type" doit toujours être "qcm" (questions à choix multiples)
- "reponse" est l'INDEX de la bonne réponse (0, 1, 2 ou 3) dans le tableau "options"
- Toujours 4 options par question
- Les mauvaises réponses doivent être crédibles
- "explication" explique pourquoi la bonne réponse est correcte
- Le contenu doit être varié (pas de questions répétitives)

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

    const contenu = await genererAvecRetry(prompt);

    // Nettoyer le contenu si l'IA a ajouté des marqueurs Markdown
    let jsonStr = contenu.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    const data = JSON.parse(jsonStr);

    return NextResponse.json({
      titre: data.titre || `Quiz — ${theme}`,
      questions: data.questions || [],
    });
  } catch (error: unknown) {
    console.error("ERREUR QUIZ:", error);
    return NextResponse.json(
      { erreur: "Erreur lors de la génération du quiz. Réessayez." },
      { status: 500 }
    );
  }
}