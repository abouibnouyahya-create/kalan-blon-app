export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function attendre(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function genererAvecRetry(prompt: string) {
  // ⚠️ Instanciation DANS la fonction, pas au niveau du module
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
        console.log(`Tentative ${tentative} avec ${modele}...`);
        const completion = await openai.chat.completions.create({
          model: modele,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });
        const contenu = completion.choices[0].message.content || "";
        if (contenu) {
          console.log(`✅ Succès avec ${modele}`);
          return contenu;
        }
      } catch (err: unknown) {
        derniereErreur = err;
        const code =
          (err as { status?: number })?.status ||
          (err as { response?: { status?: number } })?.response?.status;
        console.warn(`❌ ${modele} a échoué (code ${code})`);

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
    const { classe, serie, discipline, theme, duree } = await req.json();

    const disciplineLower = discipline.toLowerCase();
    let langueContenu = "français";
    let consigneLangue = "";

    if (disciplineLower.includes("anglais")) {
      langueContenu = "anglais";
      consigneLangue = `
⚠️ RÈGLE IMPORTANTE DE LANGUE :
- Toute la fiche doit être rédigée EN ANGLAIS (titres, consignes, contenu pédagogique).
- Seul l'en-tête administratif reste en français.
- Les consignes doivent être en anglais ("Teacher's activity", "Students' activity").
- La situation d'apprentissage doit être EN ANGLAIS mais ancrée dans le contexte malien.`;
    } else if (disciplineLower.includes("arabe")) {
      langueContenu = "arabe";
      consigneLangue = `
⚠️ RÈGLE IMPORTANTE DE LANGUE :
- Toute la fiche doit être rédigée EN ARABE.
- Seul l'en-tête administratif reste en français.`;
    } else {
      consigneLangue = `
⚠️ RÈGLE DE LANGUE :
- Toute la fiche doit être rédigée EN FRANÇAIS.`;
    }

    const prompt = `Tu es un expert en ingénierie pédagogique selon l'Approche Par Compétences (APC) du système éducatif malien.

Génère une fiche de cours COMPLÈTE pour :
- Classe : ${classe}
- Série : ${serie}
- Discipline : ${discipline}
- Thème : ${theme}
- Durée : ${duree} minutes

${consigneLangue}

Structure obligatoire :
1. Compétence disciplinaire visée
2. Compétences transversales
3. Objectifs spécifiques (3 à 4)
4. Prérequis (issus du DEF)
5. Matériel didactique
6. Situation d'apprentissage (contexte malien concret)
7. Déroulement :
   - Mise en situation (10 min)
   - Activités d'exploration (30 min)
   - Institutionnalisation (15 min)
8. Évaluation formative
9. Activités de remédiation
10. Devoir à la maison

Contraintes : pédagogie active, élèves acteurs, ressources limitées, contexte malien.

Rappel : la langue principale de la fiche est **${langueContenu}**.`;

    const contenu = await genererAvecRetry(prompt);

    return NextResponse.json({ contenu });
  } catch (error: unknown) {
    console.error("ERREUR FINALE:", error);
    const code =
      (error as { status?: number })?.status ||
      (error as { response?: { status?: number } })?.response?.status;
    let message = "Erreur lors de la génération. Réessayez dans quelques instants.";
    if (code === 503) {
      message = "Les serveurs IA sont surchargés. Patientez 1 minute et réessayez.";
    } else if (code === 401) {
      message = "Clé API invalide. Vérifiez votre fichier .env.local.";
    } else if (code === 429) {
      message = "Quota dépassé. Créez une nouvelle clé API gratuite.";
    }
    return NextResponse.json({ contenu: message }, { status: 500 });
  }
}