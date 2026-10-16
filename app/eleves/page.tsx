"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BoutonInstallation from "@/app/components/BoutonInstallation";

type Eleve = {
  id: number;
  nom: string;
  prenom: string;
  classe: string;
  serie: string | null;
  date_naissance: string | null;
  nom_parent: string | null;
};

type Note = {
  eleve_id: number;
  note: number;
  note_max: number;
};

export default function MesEleves() {
  const router = useRouter();
  const supabase = createClient();

  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [classeFiltre, setClasseFiltre] = useState("");
  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: elevesData } = await supabase
        .from("eleves")
        .select("id, nom, prenom, classe, serie, date_naissance, nom_parent")
        .eq("user_id", user.id)
        .order("nom", { ascending: true });

      const { data: notesData } = await supabase
        .from("notes")
        .select("eleve_id, note, note_max")
        .eq("user_id", user.id);

      setEleves(elevesData || []);
      setNotes(notesData || []);
      setChargement(false);
    }
    charger();
  }, [router, supabase]);

  async function supprimer(id: number) {
    if (!confirm("Supprimer cet élève et toutes ses notes ?")) return;
    const { error } = await supabase.from("eleves").delete().eq("id", id);
    if (error) {
      alert("Erreur : " + error.message);
    } else {
      setEleves(eleves.filter((e) => e.id !== id));
      setNotes(notes.filter((n) => n.eleve_id !== id));
    }
  }

  function moyenneEleve(eleveId: number): string {
    const notesEleve = notes.filter((n) => n.eleve_id === eleveId);
    if (notesEleve.length === 0) return "—";
    const sommePondere = notesEleve.reduce(
      (acc, n) => acc + (n.note / n.note_max) * 20,
      0
    );
    return (sommePondere / notesEleve.length).toFixed(2);
  }

  const classesUniques = Array.from(new Set(eleves.map((e) => e.classe))).sort();

  const elevesFiltres = eleves.filter((e) => {
    const matchRecherche =
      `${e.nom} ${e.prenom}`.toLowerCase().includes(recherche.toLowerCase());
    const matchClasse = !classeFiltre || e.classe === classeFiltre;
    return matchRecherche && matchClasse;
  });

  return (
    <main className="min-h-screen flex relative bg-[#faf6ec]">
      <div className="bande-tricolore w-2 md:w-3 h-screen fixed left-0 top-0 z-10" />

      <div className="flex-1 ml-2 md:ml-3 motif-bogolan">
        {/* Navbar responsive */}
        <nav className="border-b border-[#3e2723]/10 bg-white/60 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <Link
              href="/accueil"
              className="titre-kalan text-xl md:text-2xl font-bold text-[#14532d]"
            >
              Kalan Blon
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/accueil" className="font-medium hover:text-[#14b53a]">
                Accueil
              </Link>
              <Link href="/cours" className="font-medium hover:text-[#14b53a]">
                Fiches
              </Link>
              <Link href="/devoirs" className="font-medium hover:text-[#14b53a]">
                Devoirs
              </Link>
              <Link href="/eleves" className="font-medium text-[#14b53a]">
                Élèves
              </Link>
              <Link
                href="/eleves/nouveau"
                className="bg-[#14b53a] hover:bg-[#0f8c2c] text-white px-4 py-2 rounded-lg font-medium transition"
              >
                + Ajouter
              </Link>
            </div>

            <button
              onClick={() => setMenuOuvert(!menuOuvert)}
              className="md:hidden text-2xl text-[#14532d] p-2"
              aria-label="Menu"
            >
              {menuOuvert ? "✕" : "☰"}
            </button>
          </div>

          {menuOuvert && (
            <div className="md:hidden border-t border-[#3e2723]/10 bg-white px-4 py-3 space-y-2">
              <Link
                href="/accueil"
                onClick={() => setMenuOuvert(false)}
                className="block py-2 font-medium"
              >
                🏠 Accueil
              </Link>
              <Link
                href="/cours"
                onClick={() => setMenuOuvert(false)}
                className="block py-2 font-medium"
              >
                📚 Fiches
              </Link>
              <Link
                href="/devoirs"
                onClick={() => setMenuOuvert(false)}
                className="block py-2 font-medium"
              >
                📝 Devoirs
              </Link>
              <Link
                href="/eleves"
                onClick={() => setMenuOuvert(false)}
                className="block py-2 font-medium text-[#14b53a]"
              >
                👥 Élèves
              </Link>
              <Link
                href="/eleves/nouveau"
                onClick={() => setMenuOuvert(false)}
                className="block py-2 font-medium"
              >
                ➕ Ajouter un élève
              </Link>
            </div>
          )}
        </nav>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="mb-6 md:mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="titre-kalan text-3xl md:text-5xl font-bold text-[#14532d] mb-2">
                Mes élèves
              </h1>
              <p className="text-[#3e2723]/70 citation-kalan text-sm md:text-lg">
                Suivez vos élèves et leurs notes
              </p>
            </div>
            <Link
              href="/eleves/nouveau"
              className="hidden md:inline-block bg-[#14b53a] hover:bg-[#0f8c2c] text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              + Ajouter un élève
            </Link>
          </div>

          {/* Filtres */}
          <div className="grid md:grid-cols-2 gap-3 mb-6">
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom..."
              className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none bg-white"
            />
            <select
              value={classeFiltre}
              onChange={(e) => setClasseFiltre(e.target.value)}
              className="w-full border-2 border-[#3e2723]/10 rounded-lg p-3 focus:border-[#14b53a] focus:outline-none bg-white"
            >
              <option value="">Toutes les classes</option>
              {classesUniques.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {chargement && (
            <div className="text-center py-16 text-[#3e2723]/60 citation-kalan text-lg">
              Chargement de vos élèves…
            </div>
          )}

          {!chargement && elevesFiltres.length === 0 && (
            <div className="bg-white/70 rounded-xl p-12 text-center border border-[#3e2723]/5">
              <div className="text-5xl mb-4">👥</div>
              <h2 className="text-2xl font-bold text-[#14532d] mb-2">
                {recherche || classeFiltre
                  ? "Aucun résultat"
                  : "Aucun élève pour le moment"}
              </h2>
              <p className="text-[#3e2723]/70 mb-6">
                {recherche || classeFiltre
                  ? "Essayez d'autres filtres."
                  : "Commencez par ajouter votre premier élève."}
              </p>
              {!recherche && !classeFiltre && (
                <Link
                  href="/eleves/nouveau"
                  className="inline-block bg-[#14b53a] hover:bg-[#0f8c2c] text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Ajouter mon premier élève
                </Link>
              )}
            </div>
          )}

          {!chargement && elevesFiltres.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {elevesFiltres.map((eleve) => {
                const moyenne = moyenneEleve(eleve.id);
                const nbNotes = notes.filter(
                  (n) => n.eleve_id === eleve.id
                ).length;
                return (
                  <div
                    key={eleve.id}
                    className="bg-white rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition border border-[#3e2723]/5 flex flex-col"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#14b53a]/10 flex items-center justify-center text-xl font-bold text-[#14532d]">
                            {eleve.prenom.charAt(0)}
                            {eleve.nom.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#14532d] leading-tight">
                              {eleve.prenom} {eleve.nom}
                            </h3>
                            <p className="text-xs text-[#3e2723]/60">
                              {eleve.classe}
                              {eleve.serie && eleve.serie !== "commune"
                                ? ` (${eleve.serie})`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => supprimer(eleve.id)}
                          className="text-[#ce1126]/60 hover:text-[#ce1126] transition text-sm"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#3e2723]/60">
                          📊 {nbNotes} note{nbNotes > 1 ? "s" : ""}
                        </span>
                        <span className="font-bold text-[#14b53a] text-lg">
                          {moyenne === "—" ? "—" : `${moyenne}/20`}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[#3e2723]/10 pt-3 mt-3">
                      <Link
                        href={`/eleves/${eleve.id}`}
                        className="text-[#14b53a] font-semibold flex items-center gap-2 transition-all hover:gap-3"
                      >
                        Voir la fiche →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BoutonInstallation />
    </main>
  );
}