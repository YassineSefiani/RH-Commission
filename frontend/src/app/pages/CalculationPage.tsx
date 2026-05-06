import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { FileSpreadsheet, ExternalLink } from 'lucide-react';

// Import des images selon tes chemins
import cocaBg from '../assets/coca cola.png';
import ferreroBg from '../assets/ferrero rocher.png';
import magnumBg from '../assets/magnum.png';

const brandCards = [
  { 
    id: 'coca-cola', 
    name: 'Coca Cola', 
    image:  cocaBg, 
    description: 'Gestion des livraisons et commissions pour la gamme Coca-Cola.'
  },
  { 
    id: 'ferrero-rocher', 
    name: 'Ferrero Rocher', 
    image: ferreroBg, 
    description: 'Suivi des objectifs et primes pour les produits Ferrero.'
  },
  { 
    id: 'magnum', 
    name: 'Magnum', 
    image: magnumBg, 
    description: 'Calcul des commissions saisonnières et volume Magnum.'
  },
];

export default function CalculationPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importedFileName, setImportedFileName] = useState<string>('');

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
    <div className="p-6 md:p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header & Import Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calcul par Marque</h1>
          <p className="text-gray-500 mt-1">Choisissez une marque pour accéder au calcul spécifique ou importez vos données.</p>
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
            className="flex items-center gap-3 rounded-xl bg-[#f7a800] px-6 py-3 text-sm font-bold text-white hover:bg-orange-600 transition-all shadow-md hover:shadow-orange-200 active:scale-95"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Importer un fichier Excel
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                Secteur Distribution
              </div>
              
              <h2 className="text-3xl font-black text-white mb-2">{card.name}</h2>
              
              <p className="text-sm text-gray-300 line-clamp-2 mb-6 opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                {card.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-xs font-bold text-white backdrop-blur-md border border-white/30 group-hover:bg-white group-hover:text-black transition-all">
                  Ouvrir la gestion
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