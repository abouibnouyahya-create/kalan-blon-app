import Link from "next/link";

export default function Vestibule() {
  return (
    <main className="min-h-screen flex relative overflow-hidden bg-[#faf6ec]">
      {/* Bande tricolore verticale (drapeau malien) */}
      <div className="bande-tricolore w-2 md:w-3 h-screen fixed left-0 top-0 z-10" />

      {/* Fond avec motif bogolan */}
      <div className="absolute inset-0 motif-bogolan pointer-events-none" />

      {/* Contenu du vestibule */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-12 ml-2 md:ml-3 relative z-0 py-16">
        <div className="max-w-2xl w-full flex flex-col items-center">
          {/* Logo image */}
          <div className="mb-8">
            <img
              src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop&crop=center"
              alt="Kalan Blon"
              className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover shadow-lg ring-4 ring-white"
            />
          </div>

          {/* Nom */}
          <h1 className="titre-kalan text-5xl md:text-7xl font-black text-center mb-3 text-[#14532d]">
            Kalan Blon
          </h1>

          {/* Slogan */}
          <p className="text-center text-lg md:text-xl text-[#3e2723]/70 mb-8 tracking-wide">
            La porte du savoir
          </p>

          {/* Ligne décorative */}
          <div className="flex justify-center items-center gap-3 mb-8">
            <div className="h-px bg-[#3e2723]/20 w-16" />
            <div className="w-2 h-2 rounded-full bg-[#14b53a]" />
            <div className="h-px bg-[#3e2723]/20 w-16" />
          </div>

          {/* Message */}
          <p className="text-center text-xl md:text-2xl text-[#3e2723] leading-relaxed mb-12 citation-kalan">
            Ouvrir la porte du savoir
            <br />
            pour chaque enseignant du secondaire malien
          </p>

          {/* Bouton principal */}
          <Link
            href="/identification"
            className="bg-[#14b53a] hover:bg-[#0f8c2c] text-white px-10 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center gap-3 mb-10"
          >
            Franchir la porte
            <span className="text-2xl">→</span>
          </Link>

          {/* Touche malienne */}
          <p className="text-center text-sm text-[#3e2723]/60 mb-16">
            Kalan Blon — Un projet pour le Mali 🇲🇱
          </p>

          {/* Citation en bas */}
          <div className="text-center">
            <p className="citation-kalan text-[#3e2723]/50 text-base md:text-lg">
              « Le savoir est une porte que seul l'effort ouvre »
            </p>
            <p className="text-[#3e2723]/40 text-xs mt-1 tracking-widest uppercase">
              Proverbe bambara
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}