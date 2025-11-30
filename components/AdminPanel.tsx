import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Upload, Printer, Download } from 'lucide-react';
import { saveGameState } from '../firebaseConfig';
import { GridSection } from '../types';

interface AdminPanelProps {
  currentImageUrl: string | null;
  gridSize: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentImageUrl, gridSize }) => {
  const [loading, setLoading] = useState(false);
  const [qrCodes, setQrCodes] = useState<{id: number, url: string, code: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Simple code for demo, in production use UUID
        code: `WED-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        isUnlocked: false,
        row: Math.floor(index / gridSize),
        col: index % gridSize,
      }));

      await saveGameState(base64String, newSections);
      generateQRs(newSections);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const generateQRs = async (sections: GridSection[]) => {
    // Get the base URL of the current page (e.g., https://myapp.com or http://localhost:3000)
    // We strip any existing query parameters to ensure a clean base
    const baseUrl = window.location.origin + window.location.pathname;

    const codes = await Promise.all(sections.map(async (section) => {
      // Create a full URL that includes the code as a query parameter
      const fullUrl = `${baseUrl}?code=${section.code}`;
      
      const dataUrl = await QRCode.toDataURL(fullUrl, { 
        width: 250, // Slightly larger for better scanning
        margin: 2,
        color: { dark: '#44403c', light: '#ffffff' } // White background for print safety
      });
      return { id: section.id, url: dataUrl, code: section.code };
    }));
    setQrCodes(codes);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-stone-200 p-6 w-full animate-fade-in">
       <div className="border-b border-stone-100 pb-4 mb-4">
         <h2 className="text-xl font-bold text-stone-800">Setup Console</h2>
         <p className="text-sm text-stone-500">Prepare the game for your guests.</p>
       </div>

       <div className="space-y-8">
          {/* Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-stone-700">1. Upload Memory Photo</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors group"
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
            {currentImageUrl && <p className="text-xs text-green-600 text-center">✓ Current photo loaded</p>}
          </div>

          {/* QR Code Section */}
          {qrCodes.length > 0 && (
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <label className="block text-sm font-semibold text-stone-700">2. Print QR Cards</label>
                  <button onClick={() => window.print()} className="text-xs flex items-center gap-1 text-rose-500 hover:text-rose-600">
                    <Printer className="w-3 h-3" /> Print View
                  </button>
               </div>
               
               <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-lg overflow-y-auto max-h-[400px]">
                  {qrCodes.map((qr) => (
                    <div key={qr.id} className="bg-white p-2 rounded shadow-sm border border-stone-100 flex flex-col items-center text-center">
                       <img src={qr.url} alt="QR" className="w-full" />
                       <span className="text-[10px] font-mono text-stone-400 mt-1">{qr.code}</span>
                       <span className="text-[10px] text-stone-800 font-bold">Piece #{qr.id + 1}</span>
                    </div>
                  ))}
               </div>
               <p className="text-xs text-stone-400 italic">
                 These QR codes link directly to this app. When guests scan them with their phone camera, the specific piece will unlock automatically.
               </p>
            </div>
          )}
          
          {qrCodes.length === 0 && currentImageUrl && (
             <div className="text-center p-4 bg-stone-50 rounded text-stone-500 text-sm">
                Image uploaded. Re-upload to generate new unique QR codes for the 16 pieces.
             </div>
          )}
       </div>
    </div>
  );
};