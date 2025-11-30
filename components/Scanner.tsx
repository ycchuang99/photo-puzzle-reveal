import React, { useState } from 'react';
import { Scan, X } from 'lucide-react';

interface ScannerProps {
  onScan: (code: string) => Promise<boolean>;
  isGameComplete: boolean;
  onCancel: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, isGameComplete, onCancel }) => {
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGameComplete) return;

    setStatus('scanning');
    
    // Slight artificial delay to feel like processing
    setTimeout(async () => {
        const success = await onScan(inputValue.trim());
        if (success) {
            setStatus('success');
            setInputValue('');
            setTimeout(() => setStatus('idle'), 1500);
        } else {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    }, 800);
  };

  return (
    <div className="bg-stone-50 rounded-xl p-6 relative animate-fade-in border border-stone-200">
      <button 
        onClick={onCancel}
        className="absolute -top-3 -right-3 bg-white text-stone-400 hover:text-rose-500 rounded-full p-1 shadow-md border border-stone-100"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center gap-4">
        <div className={`
           relative w-48 h-48 border-2 rounded-2xl flex items-center justify-center transition-colors duration-500
           ${status === 'success' ? 'border-green-400 bg-green-50' : 
             status === 'error' ? 'border-rose-400 bg-rose-50' : 
             'border-stone-300 bg-stone-100'}
        `}>
            {status === 'scanning' && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-400/20 to-transparent w-full h-full animate-pulse" />
            )}
            <Scan className={`w-12 h-12 ${status === 'scanning' ? 'text-rose-400' : 'text-stone-300'}`} />
            
            {/* Overlay Status */}
            {status === 'success' && <span className="absolute text-green-600 font-bold bg-white/80 px-3 py-1 rounded-full text-sm">Found it!</span>}
            {status === 'error' && <span className="absolute text-rose-500 font-bold bg-white/80 px-3 py-1 rounded-full text-sm">Try Again</span>}
        </div>

        <form onSubmit={handleSubmit} className="w-full relative">
            <input 
              autoFocus
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type code from card..."
              className="w-full text-center bg-white border border-stone-200 text-stone-600 py-3 rounded-lg focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all font-mono placeholder:font-sans"
            />
            <button type="submit" className="sr-only">Scan</button>
        </form>
        
        <p className="text-xs text-stone-400">
          Tip: In a real app, this would use the camera automatically. <br/> For this demo, type the code found in the Admin panel.
        </p>
      </div>
    </div>
  );
};
