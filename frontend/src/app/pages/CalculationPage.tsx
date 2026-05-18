import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { FileSpreadsheet, ExternalLink } from 'lucide-react';
import { useLang } from '../context/LangContext';

// Import des images selon tes chemins
import cocaBg from '../assets/coca cola.png';
import ferreroBg from '../assets/ferrero rocher.png';
import wallsBg from '../assets/walls.jpg';

export default function CalculationPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importedFileName, setImportedFileName] = useState<string>('');
  const { t } = useLang();
  const c = t.calculation;

  const brandCards = [
    { id: 'coca-cola',      name: 'Coca Cola',      image: cocaBg,    description: c.brandDescCoca },
    { id: 'walls',          name: "Wall's",          image: wallsBg,   description: c.brandDescWalls },
    { id: 'ferrero-rocher', name: 'Ferrero Rocher',  image: ferreroBg, description: c.brandDescFerrero },
  ];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportedFileName(file.name);
      // Logique de traitement Excel à ajouter ici si besoin
    }
  };

  const handleBrandClick = (brand: string) => {
    navigate(`/calculation/brand/${encodeURIComponent(brand)}`);
  };

  return (
    <div className="abc-page-inner abc-stack-lg">
      {/* Header & Import Section */}
      <div className="abc-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="abc-h2">{c.title}</h1>
          <p className="abc-sub abc-sub-tight">{c.subtitle}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileSelected}
          />
          <button
            type="button"
            onClick={handleImportClick}
            className="abc-btn abc-btn-primary"
          >
            <FileSpreadsheet className="w-5 h-5" />
            {c.importBtn}
          </button>
          {importedFileName && (
            <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Fichier : {importedFileName}
            </div>
          )}
        </div>
      </div>

      {/* Brand Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        {brandCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleBrandClick(card.name)}
            className="group relative h-[400px] w-full overflow-hidden rounded-[2rem] border border-gray-200 shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl text-left"
          >
            {/* Image d'arrière-plan avec zoom au hover */}
            <div className="absolute inset-0 z-0">
              <img 
                src={card.image} 
                alt={card.name} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Overlay dégradé pour la lisibilité du texte */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Contenu de la carte */}
            <div className="relative z-10 flex h-full flex-col justify-end p-8">
              <div className="mb-2 inline-block w-fit rounded-full bg-[#f7a800] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                {c.sector}
              </div>
              
              <h2 className="text-3xl font-black text-white mb-2">{card.name}</h2>
              
              <p className="text-sm text-gray-300 line-clamp-2 mb-6 opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                {card.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-xs font-bold text-white backdrop-blur-md border border-white/30 group-hover:bg-white group-hover:text-black transition-all">
                  {c.openManagement}
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}