import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Upload, Printer, Lock, Unlock, X, ZoomIn, Trash2 } from 'lucide-react';
import { saveGameState, unlockSectionInDb, resetGame } from '../firebaseConfig';
import { GridSection } from '../types';

interface AdminPanelProps {
  currentImageUrl: string | null;
  sections: GridSection[];
  gridSize: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentImageUrl, sections, gridSize }) => {
  const [loading, setLoading] = useState(false);
  const [qrCodes, setQrCodes] = useState<{id: number, url: string, code: string}[]>([]);
  const [selectedQR, setSelectedQR] = useState<{id: number, url: string, code: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate QRs automatically if sections exist (e.g., on page load)
  useEffect(() => {
    if (sections.length > 0) {
      generateQRs(sections);
    }
  }, [sections]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      // Generate new sections
      const totalSections = gridSize * gridSize;
      const newSections: GridSection[] = Array.from({ length: totalSections }, (_, index) => ({
        id: index,
        code: `WED-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        isUnlocked: false,
        row: Math.floor(index / gridSize),
        col: index % gridSize,
      }));

      await saveGameState(base64String, newSections);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const generateQRs = async (sectionsList: GridSection[]) => {
    const baseUrl = window.location.origin + window.location.pathname;

    const codes = await Promise.all(sectionsList.map(async (section) => {
      const fullUrl = `${baseUrl}?code=${section.code}`;
      const dataUrl = await QRCode.toDataURL(fullUrl, { 
        width: 300, 
        margin: 2,
        color: { dark: '#44403c', light: '#ffffff' }
      });
      return { id: section.id, url: dataUrl, code: section.code };
    }));
    setQrCodes(codes);
  };

  const handleManualUnlock = async (index: number) => {
    if (!sections[index].isUnlocked) {
      await unlockSectionInDb(index, sections);
    }
  };

  const handleReset = async () => {
    if (confirm("Are you sure? This will delete the image and reset all progress for everyone.")) {
        await resetGame();
        setQrCodes([]);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-xl border border-stone-200 p-6 w-full animate-fade-in">
        <div className="border-b border-stone-100 pb-4 mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-stone-800">Setup Console</h2>
            <p className="text-sm text-stone-500">Manage image and pieces.</p>
          </div>
          {sections.length > 0 && (
              <button 
                onClick={handleReset}
                className="text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors"
                title="Reset Game"
              >
                <Trash2 className="w-5 h-5" />
              </button>
          )}
        </div>

        <div className="space-y-8">
            {/* 1. Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-stone-700">1. Upload Memory Photo</label>
              
              {!currentImageUrl ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors group"
                  >
                    <Upload className="w-8 h-8 text-stone-400 group-hover:text-rose-400 mb-2 transition-colors" />
                    <span className="text-stone-500 font-medium">
                        {loading ? 'Processing...' : 'Click to select photo'}
                    </span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </div>
              ) : (
                  <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-lg border border-stone-200">
                     <img src={currentImageUrl} alt="Preview" className="w-16 h-16 object-cover rounded shadow-sm" />
                     <div className="flex-1">
                        <p className="text-stone-700 font-bold text-sm">Active Photo</p>
                        <p className="text-xs text-stone-400">Game is live</p>
                     </div>
                     <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="text-sm text-stone-600 underline hover:text-rose-500"
                     >
                       Change
                     </button>
                     <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </div>
              )}
            </div>

            {/* 2. Manual Controls */}
            {sections.length > 0 && (
              <div className="space-y-3">
                 <label className="block text-sm font-semibold text-stone-700">2. Manual Controls</label>
                 <p className="text-xs text-stone-400">Click a number to manually unlock that piece.</p>
                 <div className="grid grid-cols-4 gap-2">
                    {sections.map((section, idx) => (
                       <button
                         key={section.id}
                         onClick={() => handleManualUnlock(idx)}
                         disabled={section.isUnlocked}
                         className={`
                           h-10 rounded text-sm font-bold flex items-center justify-center gap-1 transition-all
                           ${section.isUnlocked 
                             ? 'bg-green-100 text-green-600 cursor-default' 
                             : 'bg-stone-100 text-stone-400 hover:bg-rose-100 hover:text-rose-500 border border-stone-200'}
                         `}
                       >
                         {idx + 1}
                         {section.isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                       </button>
                    ))}
                 </div>
              </div>
            )}

            {/* 3. QR Codes */}
            {qrCodes.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <label className="block text-sm font-semibold text-stone-700">3. QR Codes</label>
                    <button onClick={() => window.print()} className="text-xs flex items-center gap-1 text-rose-500 hover:text-rose-600">
                      <Printer className="w-3 h-3" /> Print View
                    </button>
                </div>
                
                <div className="grid grid-cols-4 gap-2 bg-stone-50 p-2 rounded-lg max-h-[300px] overflow-y-auto">
                    {qrCodes.map((qr) => (
                      <button 
                        key={qr.id} 
                        onClick={() => setSelectedQR(qr)}
                        className="bg-white p-2 rounded border border-stone-100 flex flex-col items-center hover:shadow-md transition-shadow group"
                        title="Click to enlarge"
                      >
                          <div className="relative w-full">
                             <img src={qr.url} alt="QR" className="w-full opacity-90 group-hover:opacity-100" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded">
                                <ZoomIn className="w-4 h-4 text-white drop-shadow-md" />
                             </div>
                          </div>
                          <span className="text-[10px] text-stone-800 font-bold mt-1">#{qr.id + 1}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Zoom Modal */}
      {selectedQR && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setSelectedQR(null)}
        >
           <div 
             className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full relative flex flex-col items-center"
             onClick={(e) => e.stopPropagation()}
           >
              <button 
                onClick={() => setSelectedQR(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="font-serif text-xl text-stone-800 mb-4">Piece #{selectedQR.id + 1}</h3>
              
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 mb-4 w-full">
                 <img src={selectedQR.url} alt="Full QR" className="w-full h-auto" />
              </div>

              <div className="text-center space-y-1">
                 <p className="text-xs text-stone-400 uppercase tracking-wide">Code Identifier</p>
                 <p className="font-mono font-bold text-stone-600 bg-stone-100 py-1 px-3 rounded">{selectedQR.code}</p>
              </div>
           </div>
        </div>
      )}
    </>
  );
};