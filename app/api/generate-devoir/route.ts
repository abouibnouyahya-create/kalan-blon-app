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

    const prompt = `Tu es un enseignant malien expérimenté qui prépare un sujet pour ses propres élèves.

Génère un sujet complet de type : **${typeLigne}**

Paramètres :
- Classe : ${classe}
- Série : ${serie}
- Discipline : ${discipline}
- Thème : ${theme}
- Durée : ${dureeRecommandee}
- Nombre d'exercices : ${nbExercices}
- Barème total : 20 points

⚠️ RÈGLE DE LANGUE :
${consigneLangue}

🎯 RÈGLE LA PLUS IMPORTANTE — NIVEAU DE LANGAGE :

Imagine que tu écris pour un élève malien de ${classe} qui :
- Vit à Bamako, Ségou, Sikasso ou dans un village
- Va au marché, prend le Sotrama, aide ses parents
- Parle bambara à la maison, français à l'école
- N'a PAS l'habitude du français académique très soutenu

✅ LANGAGE OBLIGATOIRE :
- Phrases COURTES (maximum 15 mots)
- Mots SIMPLES et courants (comme à la radio, dans la rue, au marché)
- Exemples CONCRETS de la vie quotidienne malienne
- Direct, clair, sans détour
- Utilise "tu" ou "l'élève" (pas "l'apprenant" ni "le candidat")
- Explique les mots difficiles entre parenthèses : "l'injustice (quand on n'est pas traité comme les autres)"

❌ LANGAGE INTERDIT :
- Phrases longues avec plusieurs propositions
- Vocabulaire universitaire : "problématique", "modalité", "il convient de", "corrélativement"
- Tournures impersonnelles : "on notera que", "il est à noter que"
- Termes abstraits sans explication

📚 EXEMPLES D'ADAPTATION :

❌ MAUVAIS (trop soutenu) :
"Analysez la portée sémantique du lexique employé par l'auteur dans ce poème, en vous appuyant sur les figures de style utilisées, afin de dégager la vision du monde qui s'en dégage."

✅ BON (simple et clair) :
"Dans ce poème, l'auteur utilise des mots très forts.
1. Cite 2 mots qui montrent sa colère. (2 points)
2. Que veut-il dire avec ces mots ? Explique en 2 ou 3 phrases. (4 points)"

❌ MAUVAIS :
"À la lumière de vos connaissances sur la Négritude et des textes étudiés en classe, établissez une corrélation entre la démarche de l'auteur et celle des écrivains africains de sa génération."

✅ BON :
"Langston Hughes parle des Noirs américains. Les écrivains africains de la Négritude (comme Senghor, Césaire) font la même chose.
1. Cite 2 points communs entre ce poème et la Négritude. (3 points)
2. Explique en 3 phrases pourquoi ce poème parle aussi aux jeunes Africains d'aujourd'hui. (3 points)"

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
- Matériel autorisé : [liste simple]
- Compétences évaluées : [liste simple]
- Difficultés anticipées : [explications claires des pièges]

---

CONSIGNES FINALES :

1. Les exercices doivent être progressifs (facile → difficile)
2. Le barème doit être CLAIR et DÉTAILLÉ par question
3. **Utilise des NOMS MALIENS** : Aminata, Boubacar, Moussa, Fatoumata, Ibrahim, Aïssata, Modibo, Kadiatou...
4. **Utilise des CONTEXTES MALIENS** : marché de Médina Coura, Sotrama, Bamako, le fleuve Niger, l'école, la famille, l'agriculture, la pêche...
5. **N'utilise PAS de tableaux Markdown** (avec des | et ---). Utilise des listes à la place.
6. Pour les réponses, utilise : ______ ou .........................
7. **N'utilise PAS de symboles Markdown exotiques** (===, ***, etc.)

⚠️ AVANT DE FINALISER, VÉRIFIE QUE :
- Toutes les phrases font MOINS de 15 mots
- Aucun mot du vocabulaire interdit n'est utilisé
- Les noms et lieux sont bien maliens
- Un élève de ${classe} peut tout comprendre sans dictionnaire`;

    const sujet = await genererAvecRetry(prompt);

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