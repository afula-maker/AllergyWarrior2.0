import React, { useState } from 'react';

interface Props {
  onComplete: (name: string, allergies: string[]) => void;
}

const COMMON_ALLERGENS = [
  "חלב", "ביצים", "בוטנים", "אגוזים", "סויה", "חיטה", "גלוטן", "שומשום", "דגים", "פירות ים", "חרדל", "סלרי"
];

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  const handleToggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selectedAllergies.length > 0) {
      onComplete(name, selectedAllergies);
    }
  };

  return (
    <div className="min-h-screen bg-appBg p-8 flex flex-col items-center justify-center animate-in fade-in duration-700" dir="rtl">
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center">
          <div className="w-12 h-12 bg-warriorGreen rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
             <span className="text-xl font-black text-white">1</span>
          </div>
          <h2 className="text-3xl font-black text-dark uppercase tracking-tighter">פרופיל לוחם חדש</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">הגדר את המגבלות שלך לבטיחות מקסימלית</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-[2.5rem] island-shadow border border-black/5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-dark uppercase tracking-widest">מי הלוחם?</label>
            <input
              required
              className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:border-warriorGreen outline-none text-black font-bold"
              placeholder="למשל: יונתן, אבא, שיר..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-dark uppercase tracking-widest">בחר אלרגיות למעקב</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 hide-scrollbar">
              {COMMON_ALLERGENS.map(allergy => (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => handleToggleAllergy(allergy)}
                  className={`flex items-center justify-center py-3 rounded-xl border transition-all text-xs font-black uppercase ${
                    selectedAllergies.includes(allergy) 
                    ? 'bg-dark text-warriorGreen border-dark' 
                    : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                  }`}
                >
                  {allergy}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name || selectedAllergies.length === 0}
            className="w-full py-5 bg-dark text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl disabled:opacity-20"
          >
            צור פרופיל והתחל
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;