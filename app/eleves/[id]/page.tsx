"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Eleve = {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  classe: string;
  serie: string | null;
  nom_parent: string | null;
  telephone_parent: string | null;
  notes_libres: string | null;
};

type Note = {
  id: number;
  matiere: string;
  type_evaluation: string;
  titre: string | null;
  note: number;
  note_max: number;
  date_evaluation: string | null;
  commentaire: string | null;
};

export default function FicheEleve() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;

  const [eleve, setEleve] = useState<Eleve | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [chargement, setChargement] = useState(true);

  // Formulaire nouvelle note
  const [formOuvert, setFormOuvert] = useState(false);
  const [matiere, setMatiere] = useState("");
  const [typeEval, setTypeEval] = useState("devoir");
  const [titre, setTitre] = useState("");
  const [noteValeur, setNoteValeur] = useState("");
  const [noteMax, setNoteMax] = useState("20");
  const [dateEval, setDateEval] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    async function charger() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: eleveData, error: eleveError } = await supabase
        .from("eleves")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (eleveError || !eleveData) {
        alert("Élève introuvable");
        router.push("/eleves");
        return;
      }
      setEleve(eleveData);

      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("eleve_id", id)
        .eq("user_id", user.id)
        .order("date_evaluation", { ascending: false });

      setNotes(notesData || []);
      setChargement(false);
    }
    charger();
  }, [id, router, supabase]);

  async function ajouterNote() {
    if (!matiere.trim() || !noteValeur) {
      alert("Remplis la matière et la note");
      return;
    }
    setEnregistrement(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .insert([
        {
          user_id: user.id,
          eleve_id: parseInt(id),
          matiere: matiere.trim(),
          type_evaluation: typeEval,
          titre: titre.trim() || null,
          note: parseFloat(noteValeur),
          note_max: parseFloat(noteMax) || 20,
          date_evaluation: dateEval || null,
          commentaire: commentaire.trim() || null,
        },
      ])
      .select();

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      if (data) setNotes([...notes, ...data]);
      // Reset
      setMatiere("");
      setTitre("");
      setNoteValeur("");
      setNoteMax("20");
      setDateEval("");
      setCommentaire("");
      setFormOuvert(false);
    }
    setEnregistrement(false);
  }

  async function supprimerNote(noteId: number) {
    if (!confirm("Supprimer cette note ?")) return;
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) {
      alert("Erreur : " + error.message);
    } else {
      setNotes(notes.filter((n) => n.id !== noteId));
    }
  }

  function libelleType(type: string) {
    switch (type) {
      case "devoir":
        return "Devoir";
      case "composition":
        return "Composition";
      case "interrogation":
        return "Interrogation";
      default:
        return type;
    }
  }

  function couleurType(type: string) {
    switch (type) {
      case "devoir":
        return "bg-blue-100 text-blue-800";
      case "composition":
        return "bg-purple-100 text-purple-800";
      case "interrogation":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function moyenneGenerale(): string {
    if (notes.length === 0) return "—";
    const somme = notes.reduce(
      (acc, n) => acc + (n.note / n.note_max) * 20,
      0
    );
    return (somme / notes.length).toFixed(2);
  }

  function moyenneParMatiere(): { matiere: string; moyenne: string; nb: number }[] {
    const groupes: { [key: string]: number[] } = {};
    notes.forEach((n) => {
      if (!groupes[n.matiere]) groupes[n.matiere] = [];
      groupes[n.matiere].push((n.note / n.note_max) * 20);
    });
    return Object.keys(groupes)
      .sort()
      .map((matiere) => {
        const moyennes = groupes[matiere];
        const moy = moyennes.reduce((a, b) => a + b, 0) / moyennes.length;
        return { matiere, moyenne: moy.toFixed(2), nb: moyennes.length };
      });
  }

  if (chargement) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf6ec]">
        <p className="text-[#3e2723]/60 citation-kalan text-lg">Chargement…</p>
      </main>
    );
  }

  if (!eleve) return null;

  const moyennesMatieres = moyenneParMatiere();

  return (
    <main className="min-h-screen bg-[#faf6ec] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/eleves"
            className="text-sm text-[#3e2723]/60 hover:text-[#3e2723]"
          >
            ← Retour à mes élèves
          </Link>
        </div>

        {/* En-tête élève */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#3e2723]/5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#14b53a]/10 flex items-center justify-center text-2xl md:text-3xl font-bold text-[#14532d]">
              {eleve.prenom.charAt(0)}
              {eleve.nom.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="titre-kalan text-2xl md:text-3xl font-bold text-[#14532d] mb-1">
                {eleve.prenom} {eleve.nom}
              </h1>
              <p className="text-[#3e2723]/70 text-sm">
                {eleve.classe}
                {eleve.serie && eleve.serie !== "commune"
                  ? ` (${eleve.serie})`
                  : ""}
                {eleve.date_naissance
                  ? ` · Né(e) le ${new Date(
                      eleve.date_naissance
                    ).toLocaleDateString("fr-FR")}`
                  : ""}
              </p>
              {eleve.nom_parent && (
                <p className="text-[#3e2723]/60 text-sm mt-1">
                  👨‍👩‍👧 {eleve.nom_parent}
                  {eleve.telephone_parent ? ` · ${eleve.telephone_parent}` : ""}
                </p>
              )}
            </div>
          </div>

          {eleve.notes_libres && (
            <div className="mt-4 pt-4 border-t border-[#3e2723]/10">
              <p className="text-sm text-[#3e2723]/70 italic">
                📝 {eleve.notes_libres}
              </p>
            </div>
          )}
        </div>

        {/* Moyenne générale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#14b53a] text-white rounded-xl p-6 shadow-sm">
            <p className="text-sm opacity-80 mb-1">Moyenne générale</p>
            <p className="text-4xl font-bold">{moyenneGenerale()}/20</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#3e2723]/5">
            <p className="text-sm text-[#3e2723]/60 mb-1">Nombre de notes</p>
            <p className="text-4xl font-bold text-[#14532d]">{notes.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#3e2723]/5">
            <p className="text-sm text-[#3e2723]/60 mb-1">Matières suivies</p>
            <p className="text-4xl font-bold text-[#14532d]">
              {moyennesMatieres.length}
            </p>
          </div>
        </div>

        {/* Moyennes par matière */}
        {moyennesMatieres.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#3e2723]/5 mb-6">
            <h2 className="text-xl font-bold text-[#14532d] mb-4">
              📊 Moyennes par matière
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {moyennesMatieres.map((m) => (
                <div
                  key={m.matiere}
                  className="bg-[#faf6ec] rounded-lg p-3 border border-[#3e2723]/5"
                >
                  <p className="font-semibold text-sm text-[#3e2723]">
                    {m.matiere}
                  </p>
                  <p className="text-xl font-bold text-[#14532d]">
                    {m.moyenne}/20
                  </p>
                  <p className="text-xs text-[#3e2723]/50">
                    {m.nb} note{m.nb > 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton ajouter note */}
        <div className="mb-4">
          <button
            onClick={() => setFormOuvert(!formOuvert)}
            className="w-full bg-[#fcd116] text-[#3e2723] py-3 rounded-lg font-semibold hover:bg-[#e6bc00] transition"
          >
            {formOuvert ? "✕ Annuler" : "➕ Ajouter une note"}
          </button>
        </div>

        {/* Formulaire nouvelle note */}
        {formOuvert && (
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-[#fcd116]/30 mb-6 space-y-4">
            <h3 className="font-bold text-[#14532d] text-lg">
              Nouvelle note
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-sm">
                  Matière <span className="text-[#ce1126]">*</span>
                </label>
                <input
                  type="text"
                  value={matiere}
                  onChange={(e) => setMatiere(e.target.value)}
                  placeholder="Ex : Mathématiques"
                  className="w-full border-2 border-[#3e2723]/10 rounded-lg p-2 focus:border-[#14b53a] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">
                  Type <span className="text-[#ce1126]">*</span>
                </label>
                <select
                  value={typeEval}
                  onChange={(e) => setTypeEval(e.target.value)}
                  className="w-full border-2 border-[#3e2723]/10 rounded-lg p-2 focus:border-[#14b53a] focus:outline-none text-sm"
                >
                  <option value="devoir">Devoir</option>
                  <option value="composition">Composition</option>
                  <option value="interrogation">Interrogation</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-sm">
                Titre (optionnel)
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex : DS1, Composition 1er trimestre"
                className="w-full border-2 border-[#3e2723]/10 rounded-lg p-2 focus:border-[#14b53a] focus:outline-none text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-sm">
                  Note <span className="text-[#ce1126]">*</span>
                </label>
                <input
                  type="number"
                  value={noteValeur}
                  onChange={(e) => setNoteValeur(e.target.value)}
                  placeholder="15"
                  step="0.25"
                  min="0"
                  className="w-full border-2 border-[#3e2723]/10 rounded-lg p-2 focus:border-[#14b53a] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">
                  Sur (max)
                </label>
                <input
                  type="number"
                  value={noteMax}
                  onChange={(e) => setNoteMax(e.target.value)}
                  placeholder="20"
                  className="w-full border-2 border-[#3e2723]/10 rounded-lg p-2 focus:border-[#14b53a] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">
                  Date
                </label>
                <input
                  type="date"
                  value={dateEval}
                  onChange={(e) => setDateEval(e.target.value)}
                  className="w-full border-2 border-[#3e2723]/10 rounded-lg p-2 focus:border-[#14b53a] focus:outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-sm">
                Commentaire (optionnel)
              </label>
              <input
                type="text"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Ex : Bonne progression"
                className="w-full border-2 border-[#3e2723]/10 rounded-lg p-2 focus:border-[#14b53a] focus:outline-none text-sm"
              />
            </div>
            <button
              onClick={ajouterNote}
              disabled={enregistrement}
              className="w-full bg-[#14b53a] hover:bg-[#0f8c2c] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {enregistrement ? "Enregistrement…" : "Enregistrer la note"}
            </button>
          </div>
        )}

        {/* Liste des notes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#3e2723]/5">
          <h2 className="text-xl font-bold text-[#14532d] mb-4">
            📝 Notes ({notes.length})
          </h2>
          {notes.length === 0 ? (
            <p className="text-center text-[#3e2723]/50 py-8">
              Aucune note pour le moment. Ajoutez la première !
            </p>
          ) : (
            <div className="space-y-2">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between p-3 bg-[#faf6ec] rounded-lg border border-[#3e2723]/5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-[#3e2723]">
                        {n.matiere}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${couleurType(
                          n.type_evaluation
                        )}`}
                      >
                        {libelleType(n.type_evaluation)}
                      </span>
                      {n.titre && (
                        <span className="text-xs text-[#3e2723]/60">
                          {n.titre}
                        </span>
                      )}
                    </div>
                    {n.date_evaluation && (
                      <p className="text-xs text-[#3e2723]/50">
                        {new Date(n.date_evaluation).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                    {n.commentaire && (
                      <p className="text-xs italic text-[#3e2723]/60 mt-1">
                        {n.commentaire}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#14532d]">
                      {n.note}/{n.note_max}
                    </span>
                    <button
                      onClick={() => supprimerNote(n.id)}
                      className="text-[#ce1126]/60 hover:text-[#ce1126] text-sm"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}