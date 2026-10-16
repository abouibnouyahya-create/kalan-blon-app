"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NouvelEleve() {
  const router = useRouter();
  const supabase = createClient();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [classe, setClasse] = useState("");
  const [serie, setSerie] = useState("commune");
  const [nomParent, setNomParent] = useState("");
  const [telephoneParent, setTelephoneParent] = useState("");
  const [notesLibres, setNotesLibres] = useState("");
  const [chargement, setChargement] = useState(false);
  const [verif, setVerif] = useState(true);

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

  async function enregistrer() {
    if (!nom.trim() || !prenom.trim() || !classe.trim()) {
      alert("Remplis au moins le nom, le prénom et la classe");
      return;
    }
    setChargement(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Vous devez être connecté.");
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("eleves").insert([
      {
        user_id: user.id,
        nom: nom.trim(),
        prenom: prenom.trim(),
        date_naissance: dateNaissance || null,
        classe: classe.trim(),
        serie: serie || null,
        nom_parent: nomParent.trim() || null,
        telephone_parent: telephoneParent.trim() || null,
        notes_libres: notesLibres.trim() || null,
      },
    ]);

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      router.push("/eleves");
    }
    setChargement(false);
  }

  if (verif) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf6ec]">
        <p className="text-[#3e2723]/60 citation-kalan text-lg">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf6ec] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/eleves"
            className="text-sm text-[#3e2723]/60 hover:text-[#3e2723]"
          >
            ← Retour à mes élèves
          </Link>
        </div>

        <h1 className="titre-kalan text-3xl md:text-4xl font-bold text-[#14532d] mb-6">
          Ajouter un élève
        </h1>

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">
                Nom <span className="text-[#ce1126]">*</span>
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex : Traoré"
                className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Prénom <span className="text-[#ce1126]">*</span>
              </label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex : Aminata"
                className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Date de naissance</label>
              <input
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Classe <span className="text-[#ce1126]">*</span>
              </label>
              <input
                type="text"
                value={classe}
                onChange={(e) => setClasse(e.target.value)}
                placeholder="Ex : 10ème A"
                className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Série (optionnel)</label>
            <select
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">
                Nom du parent
              </label>
              <input
                type="text"
                value={nomParent}
                onChange={(e) => setNomParent(e.target.value)}
                placeholder="Ex : Moussa Traoré"
                className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Téléphone du parent
              </label>
              <input
                type="tel"
                value={telephoneParent}
                onChange={(e) => setTelephoneParent(e.target.value)}
                placeholder="+223 76 XX XX XX"
                className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">
              Notes libres (optionnel)
            </label>
            <textarea
              value={notesLibres}
              onChange={(e) => setNotesLibres(e.target.value)}
              placeholder="Observations, besoins particuliers…"
              rows={3}
              className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none"
            />
          </div>

          <button
            onClick={enregistrer}
            disabled={chargement}
            className="w-full bg-[#14b53a] hover:bg-[#0f8c2c] text-white py-3 rounded-lg font-semibold text-lg transition disabled:opacity-50"
          >
            {chargement ? "Enregistrement…" : "Enregistrer l'élève"}
          </button>
        </div>
      </div>
    </main>
  );
}