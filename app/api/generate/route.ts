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
    const { classe, serie, discipline, theme, duree } = await req.json();

    // Déterminer la langue
    const disciplineLower = discipline.toLowerCase();
    let langueContenu = "français";
    let consigneLangue = "Toute la fiche doit être rédigée EN FRANÇAIS.";

    if (disciplineLower.includes("anglais")) {
      langueContenu = "anglais";
      consigneLangue = `Toute la fiche doit être rédigée EN ANGLAIS, sauf :
- L'en-tête administratif (République du Mali, Ministère, Établissement, Classe, Durée)
- Les consignes générales pour l'enseignant
Tout le reste (compétences, objectifs, situation, déroulement, évaluation) doit être EN ANGLAIS.`;
    } else if (disciplineLower.includes("arabe")) {
      langueContenu = "arabe";
      consigneLangue =
        "Toute la fiche doit être rédigée EN ARABE, sauf l'en-tête administratif.";
    }

    const prompt = `Tu es un enseignant malien expérimenté qui prépare une fiche de cours APC pour tes propres élèves.

Génère une fiche de cours COMPLÈTE pour :
- Classe : ${classe}
- Série : ${serie}
- Discipline : ${discipline}
- Thème : ${theme}
- Durée : ${duree} minutes

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
- Utilise "l'élève" ou "tu" (pas "l'apprenant" ni "le candidat")
- Explique les mots difficiles entre parenthèses : "une métaphore (une comparaison sans le mot 'comme')"

❌ LANGAGE INTERDIT :
- Phrases longues avec plusieurs propositions
- Vocabulaire universitaire : "problématique", "modalité", "il convient de", "corrélativement"
- Tournures impersonnelles : "on notera que", "il est à noter que"
- Termes abstraits sans explication

📚 EXEMPLES D'ADAPTATION :

❌ MAUVAIS (trop soutenu) :
"L'objectif est d'amener l'apprenant à mobiliser ses ressources cognitives afin de construire une compétence de communication écrite en contexte argumentatif."

✅ BON (simple et clair) :
"À la fin du cours, l'élève sera capable d'écrire un texte pour défendre son opinion."

❌ MAUVAIS :
"Il convient de procéder à une contextualisation des savoirs en vue de favoriser leur transfert en situation réelle."

✅ BON :
"On commence par un exemple de la vie de tous les jours. Comme ça, l'élève comprend mieux."

STRUCTURE OBLIGATOIRE (Markdown) :

# RÉPUBLIQUE DU MALI
## Ministère de l'Éducation Nationale
### Lycée Public de Bamako

---

## FICHE DE COURS APC N°___

**Discipline :** ${discipline}
**Classe :** ${classe}${serie && serie !== "commune" ? ` (${serie})` : ""}
**Thème :** ${theme}
**Durée :** ${duree} minutes

---

### 1. COMPÉTENCE VISÉE
[Une phrase simple et claire]

### 2. OBJECTIFS SPÉCIFIQUES
À la fin du cours, l'élève sera capable de :
- [Objectif 1 - verbe simple : identifier, expliquer, calculer, écrire...]
- [Objectif 2]
- [Objectif 3]

### 3. PRÉREQUIS
Ce que l'élève doit déjà savoir :
- [Prérequis 1 en mots simples]
- [Prérequis 2]

### 4. MATÉRIEL DIDACTIQUE
- [Liste de matériel SIMPLE et disponible au Mali : tableau, craie, cahiers, stylos, objets du quotidien...]

### 5. SITUATION D'APPRENTISSAGE
[Une histoire courte avec des personnages maliens, dans un lieu malien, avec un problème à résoudre]

**Contexte :** [2-3 phrases maximum]
**Tâche :** [Ce que l'élève doit faire, en une phrase]

### 6. DÉROULEMENT DU COURS

#### Phase 1 : Mise en situation (10 minutes)
**Ce que fait le professeur :**
- [Actions simples]
**Ce que font les élèves :**
- [Actions simples]

#### Phase 2 : Activités d'exploration (30 minutes)
**Activité 1 :** [Titre simple]
- Consigne : [Claire et courte]
- Ce que font les élèves : [Simple]

**Activité 2 :** [Titre simple]
- Consigne : [Claire et courte]

#### Phase 3 : Institutionnalisation (15 minutes)
**La règle à retenir :**
- [Règle écrite simplement, comme au tableau]

### 7. ÉVALUATION FORMATIVE
1. [Question simple] (X points)
2. [Question simple] (X points)

### 8. ACTIVITÉS DE REMÉDIATION
Pour les élèves en difficulté :
- [Suggestion 1 simple]

### 9. DEVOIR À LA MAISON
- [Exercice simple à faire à la maison]

---

CONSIGNES FINALES :

1. **Utilise des NOMS MALIENS** dans les exemples : Aminata, Boubacar, Moussa, Fatoumata, Ibrahim, Aïssata, Modibo, Kadiatou...
2. **Utilise des CONTEXTES MALIENS** : marché de Médina Coura, Sotrama, Bamako, fleuve Niger, école, famille, agriculture, pêche, élevage...
3. **N'utilise PAS de tableaux Markdown** (avec des | et ---). Utilise des listes.
4. **N'utilise PAS de symboles Markdown exotiques** (===, ***, etc.)
5. Le vocabulaire doit être accessible à un élève de ${classe}
6. Les consignes pour le professeur doivent être pratiques et concrètes

⚠️ AVANT DE FINALISER, VÉRIFIE QUE :
- Toutes les phrases font MOINS de 15 mots
- Aucun mot du vocabulaire interdit n'est utilisé
- Les noms et lieux sont bien maliens
- Un élève de ${classe} peut tout comprendre sans dictionnaire
- La fiche est prête à être utilisée en classe sans modification`;

    const contenu = await genererAvecRetry(prompt);

    return NextResponse.json({ contenu });
  } catch (error: unknown) {
    console.error("ERREUR FINALE:", error);
    const code =
      (error as { status?: number })?.status ||
      (error as { response?: { status?: number } })?.response?.status;
    let message =
      "Erreur lors de la génération. Réessayez dans quelques instants.";
    if (code === 503) {
      message =
        "Les serveurs IA sont surchargés. Patientez 1 minute et réessayez.";
    } else if (code === 401) {
      message = "Clé API invalide. Vérifiez votre fichier .env.local.";
    } else if (code === 429) {
      message = "Quota dépassé. Créez une nouvelle clé API gratuite.";
    }
    return NextResponse.json({ contenu: message }, { status: 500 });
  }
}