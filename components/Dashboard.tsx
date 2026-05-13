import React, { useState } from 'react';
import { HistoryItem, AnalysisResult } from '../types';
import { analyzeProduct } from '../services/geminiService';

interface Props {
  history: HistoryItem[];
  onNavigate: () => void;
  activeAllergens: string[];
  onScanComplete: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

const Dashboard: React.FC<Props> = ({ history, onNavigate, activeAllergens, onScanComplete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const safeHistory = history.filter(h => h.isSafe && h.isEdible);
  const activeCount = activeAllergens.length;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    if (activeAllergens.length === 0) {
      setError("אנא הגדר אלרגיות בפרופילים לפני החיפוש");
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const result = await analyzeProduct({ text: searchQuery }, activeAllergens);
      
      // Client-side safety guard
      const actualAllergensFound = (result.allergensFound || []).filter(all => 
        activeAllergens.some(active => all.toLowerCase().includes(active.toLowerCase()) || active.toLowerCase().includes(all.toLowerCase()))
      );
      result.allergensFound = actualAllergensFound;
      result.isSafe = actualAllergensFound.length === 0;

      setSearchResult(result);
      onScanComplete({
        productName: result.productName,
        isSafe: result.isSafe,
        isEdible: result.isEdible,
        allergensFound: result.allergensFound,
      });
    } catch (err) {
      setError("שגיאה בחיפוש המוצר. נסה שוב.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 py-6 animate-in slide-in-from-bottom duration-500">
      <div className="px-1">
        <h2 className="text-3xl font-black text-dark tracking-tighter uppercase leading-[0.85] mb-2">My<br/><span className="text-warriorGreen">Products</span></h2>
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">חיפוש וסריקת מוצרים בטוחים</p>
      </div>

      <div className="px-1">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            className="w-full px-6 py-5 rounded-[2rem] bg-white border border-black/5 focus:border-warriorGreen outline-none transition-all font-bold text-black placeholder-gray-300 premium-shadow pr-14"
            placeholder="חפש מוצר, מותג או רכיבים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isSearching}
          />
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-dark text-white rounded-2xl flex items-center justify-center">
            {isSearching ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          </button>
        </form>
      </div>

      {searchResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in border-b-8 ${!searchResult.isEdible ? 'border-white' : 'border-warriorGreen'}`}>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-black text-dark uppercase tracking-tighter leading-none truncate">{searchResult.productName}</h3>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${!searchResult.isEdible ? 'bg-gray-400 text-white' : searchResult.isSafe ? 'bg-warriorGreen text-white' : 'bg-red-500 text-white'}`}>
                  {!searchResult.isEdible ? 'לא אכיל' : searchResult.isSafe ? 'בטוח' : 'מסוכן'}
                </span>
              </div>

              {!searchResult.isEdible ? (
                 <div className="bg-gray-50 p-8 rounded-3xl border border-black/5 text-center">
                    <p className="text-dark text-lg font-black leading-tight mb-2">זה אינו מוצר אכיל</p>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">אנא נסה שוב עם מוצר מזון</p>
                 </div>
              ) : (
                <>
                  {!searchResult.isSafe && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">אלרגן זוהה:</p>
                      <div className="flex flex-wrap gap-2">
                        {searchResult.allergensFound.map(a => (<span key={a} className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-xl">{a}</span>))}
                      </div>
                    </div>
                  )}
                  <div className="bg-gray-50 p-6 rounded-3xl border border-black/5"><p className="text-dark text-sm font-bold leading-relaxed">{searchResult.summary}</p></div>
                </>
              )}

              <button onClick={() => setSearchResult(null)} className="w-full py-5 bg-dark text-white rounded-2xl font-black text-xs uppercase active:scale-95 transition-all">סגור</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mx-1 px-4 py-4 bg-red-50 text-red-600 rounded-[1.5rem] text-[12px] font-bold text-center">{error}</div>}

      <div className="relative">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">מוצרים בטוחים שסרקת</h3>
        {safeHistory.length === 0 ? (
          <div className="bg-white border border-black/5 rounded-[2.5rem] p-12 text-center space-y-4 mx-1 premium-shadow">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">אין עדיין מוצרים בטוחים</p>
            <button onClick={onNavigate} className="bg-dark text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase">סרוק עכשיו</button>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 px-1 pb-8 hide-scrollbar snap-x">
            {safeHistory.map((item) => (
              <div key={item.id} className="flex-shrink-0 w-44 snap-center">
                <div className="bg-warriorGreen rounded-[2.5rem] p-5 h-64 flex flex-col justify-between shadow-xl relative overflow-hidden active:scale-95 transition-transform">
                  <div className="absolute top-4 left-4 w-7 h-7 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-md z-10">
                     <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-4">
                    <div className="w-20 h-20 bg-white/20 rounded-full blur-xl absolute" />
                    <span className="text-6xl drop-shadow-lg">🍎</span>
                  </div>
                  <div className="text-white space-y-1 relative z-10">
                    <h4 className="font-black text-sm uppercase truncate leading-tight">{item.productName}</h4>
                    <p className="text-[9px] font-bold text-white/60 uppercase">בטוח לשימוש</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-1">
        <div className="bg-dark p-8 rounded-[2.5rem] text-white relative overflow-hidden premium-shadow">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">Safety Monitor</h3>
          <p className="text-[10px] text-warriorGreen font-black tracking-widest uppercase mb-6 opacity-80">בדיקה אוטומטית פעילה</p>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-warriorGreen rounded-2xl flex items-center justify-center text-dark font-black text-2xl shadow-lg shadow-warriorGreen/20">{activeCount}</div>
            <p className="text-xs font-bold leading-snug flex-1">מערכת ה-AI עוקבת אחר {activeCount} רגישויות שהגדרת בפרופילים שלך.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;