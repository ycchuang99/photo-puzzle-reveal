import React, { useState, useEffect } from 'react';
import { PuzzleGrid } from './components/PuzzleGrid';
import { AdminPanel } from './components/AdminPanel';
import { GridSection } from './types';
import { Heart, Settings, CheckCircle, Sparkles, Gift, ArrowRight } from 'lucide-react';
import { subscribeToGame, unlockSectionInDb } from './firebaseConfig';

// Updated to 4x4 grid (16 pieces)
const GRID_SIZE = 4;

const App: React.FC = () => {
  const [sections, setSections] = useState<GridSection[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // State for handling URL-based unlocking
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [unlockedInfo, setUnlockedInfo] = useState<{id: number, isNew: boolean} | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // 1. Check URL for code on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setIsVerifying(true);
      setPendingCode(code);
      // Clean the URL so refreshing doesn't re-trigger
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // 2. Subscribe to Data (Firebase or Local)
  useEffect(() => {
    const unsubscribe = subscribeToGame((data) => {
      if (data) {
        setSections(data.sections || []);
        setImageUrl(data.imageUrl || null);
        
        const allUnlocked = data.sections?.every((s: GridSection) => s.isUnlocked) ?? false;
        setIsComplete(allUnlocked);
      }
    });
    // @ts-ignore
    return () => unsubscribe && typeof unsubscribe === 'function' ? unsubscribe() : null;
  }, []);

  // 3. Process Pending Code when sections are loaded
  useEffect(() => {
    if (pendingCode && sections.length > 0) {
      handleUrlUnlock(pendingCode);
      setPendingCode(null); // Clear after attempt
    }
  }, [pendingCode, sections]);

  const handleUrlUnlock = async (code: string) => {
    // Artificial delay for better UX (so the loading screen doesn't just flicker)
    await new Promise(r => setTimeout(r, 800));

    const sectionIndex = sections.findIndex(s => s.code === code);
    
    if (sectionIndex !== -1) {
      const isAlreadyUnlocked = sections[sectionIndex].isUnlocked;
      
      if (!isAlreadyUnlocked) {
        await unlockSectionInDb(sectionIndex, sections);
      }
      
      setUnlockedInfo({ 
        id: sections[sectionIndex].id + 1, 
        isNew: !isAlreadyUnlocked 
      });
      setIsVerifying(false);
    } else {
      // Code not found
      setIsVerifying(false);
      showNotification("Invalid QR Code", 'info');
    }
  };

  const showNotification = (msg: string, type: 'success' | 'info') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const unlockedCount = sections.filter(s => s.isUnlocked).length;
  const totalSections = sections.length;

  // --- RENDER STATES ---

  // 1. Loading / Verifying Screen
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] flex flex-col items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-full shadow-2xl animate-pulse">
           <Heart className="w-16 h-16 text-rose-400 fill-rose-100" />
        </div>
        <h2 className="mt-8 text-2xl font-serif text-stone-600 tracking-widest uppercase">Verifying Memory...</h2>
      </div>
    );
  }

  // 2. Success / Congratulation Screen
  if (unlockedInfo) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-rose-100 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-100 rounded-full blur-3xl opacity-30 translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 max-w-md w-full bg-white p-10 rounded-2xl shadow-2xl border border-stone-100 flex flex-col items-center">
            <div className="mb-6 p-4 bg-green-50 rounded-full border border-green-100">
               {unlockedInfo.isNew ? (
                 <Gift className="w-12 h-12 text-green-500" />
               ) : (
                 <CheckCircle className="w-12 h-12 text-green-500" />
               )}
            </div>
            
            <h1 className="font-script text-5xl text-rose-500 mb-2">Congratulations!</h1>
            <h2 className="text-xl font-serif text-stone-700 mb-6">
              {unlockedInfo.isNew ? "You Unlocked a Memory" : "Memory Already Found"}
            </h2>
            
            <p className="text-stone-500 mb-8 leading-relaxed">
              {unlockedInfo.isNew 
                ? `Thank you for being part of our special day. You have successfully revealed Piece #${unlockedInfo.id}.`
                : `Piece #${unlockedInfo.id} has already been added to the collection. Go check the full picture!`}
            </p>

            <button 
              onClick={() => setUnlockedInfo(null)}
              className="group flex items-center gap-2 bg-stone-800 text-white px-8 py-4 rounded-full hover:bg-rose-500 transition-all duration-300 shadow-lg hover:shadow-rose-200"
            >
              <span>Reveal the Picture</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    );
  }

  // 3. Main App Dashboard
  return (
    <div className="min-h-screen flex flex-col items-center bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
      
      {/* Toast Notification (for general messages) */}
      {notification && (
        <div className="fixed top-20 z-50 animate-fade-in px-6 py-3 rounded-full shadow-lg bg-white border border-rose-100 flex items-center gap-2 text-stone-700">
           {notification.type === 'success' ? <Sparkles className="w-5 h-5 text-yellow-500" /> : <Heart className="w-5 h-5 text-rose-400" />}
           <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Navigation / Header */}
      <nav className="w-full p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-40 border-b border-stone-200 shadow-sm">
        <div className="flex items-center gap-2 text-rose-400">
           <Heart className="w-6 h-6 fill-current" />
           <span className="font-script text-2xl text-stone-600 font-bold">Forever & Always</span>
        </div>
        <button 
          onClick={() => setIsAdmin(!isAdmin)}
          className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
          title="Admin Panel"
        >
          <Settings className="w-5 h-5" />
        </button>
      </nav>

      <main className="flex-1 w-full max-w-4xl p-6 flex flex-col items-center gap-8 animate-fade-in">
        
        {/* Title Section */}
        <div className="text-center space-y-2 mt-4">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 tracking-wide">
            Our Wedding Memory
          </h1>
          <p className="text-stone-500 font-light italic text-lg">
            Find the QR codes to reveal the photo
          </p>
        </div>

        {/* Content Area */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-4">
          
          {/* Left: The Puzzle */}
          <div className="flex flex-col items-center">
            <div className="relative p-3 bg-white shadow-2xl rounded-sm rotate-1 hover:rotate-0 transition-transform duration-500">
               {/* Tape effect */}
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/40 backdrop-blur-sm shadow-sm rotate-2 z-10 opacity-80" />
               
               <PuzzleGrid 
                  sections={sections} 
                  gridSize={GRID_SIZE} 
                  imageUrl={imageUrl} 
                  isComplete={isComplete}
               />
            </div>
            
            <div className="mt-8 flex flex-col items-center space-y-3">
               <div className="text-sm tracking-widest uppercase text-stone-400">Collection Progress</div>
               <div className="text-xs text-rose-400 font-bold">{unlockedCount} / {totalSections} Pieces Found</div>
               <div className="w-64 h-2 bg-stone-200 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-rose-400 transition-all duration-1000" 
                    style={{ width: `${(unlockedCount / (totalSections || 1)) * 100}%` }}
                 />
               </div>
            </div>
          </div>

          {/* Right: Controls or Admin */}
          <div className="w-full flex flex-col gap-6">
            
            {isAdmin ? (
               <AdminPanel 
                 currentImageUrl={imageUrl} 
                 gridSize={GRID_SIZE} 
               />
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                 {/* Guest View */}
                 <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-100 w-full text-center">
                    {isComplete ? (
                        <div className="space-y-4 py-8">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-stone-800">Memory Revealed!</h3>
                            <p className="text-stone-500">Thank you for being part of our story.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                           <p className="text-stone-600 leading-relaxed text-lg">
                             We've hidden <strong>{totalSections} pieces</strong> of a special photo around the venue.
                           </p>
                           
                           <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                              <p className="text-stone-500 italic mb-2">How to play:</p>
                              <ol className="text-left text-stone-600 space-y-3 list-decimal list-inside">
                                <li>Look for QR cards on tables or walls.</li>
                                <li>Scan them with your <strong>phone camera</strong>.</li>
                                <li>A congratulations message will appear.</li>
                                <li>The picture will reveal itself here!</li>
                              </ol>
                           </div>

                           <div className="text-sm text-stone-400">
                             Keep this page open to see live progress!
                           </div>
                        </div>
                    )}
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;