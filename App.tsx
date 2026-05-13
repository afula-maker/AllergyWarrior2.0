
import React, { useState, useEffect } from 'react';
import { User, Profile, Group, HistoryItem } from './types';
import { db } from './services/db';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ProfileManager from './components/ProfileManager';
import Scanner from './components/Scanner';
import History from './components/History';
import Account from './components/Account';
import Navigation from './components/Navigation';
import ProductDetails from './components/ProductDetails';
import { RecommendedProduct } from './types';

type View = 'onboarding' | 'dashboard' | 'profiles' | 'scan' | 'history' | 'account' | 'product-details';

interface SharedData {
  type: 'profile' | 'group';
  data: any;
  nestedProfiles?: Profile[];
}

/**
 * Robust Unicode-safe decoding for Base64 Hebrew strings.
 */
function unicodeAtob(str: string) {
  try {
    // Correct way to decode Base64 UTF-8
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.error("Decoding error", e);
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [selectedRecommendedProduct, setSelectedRecommendedProduct] = useState<RecommendedProduct | null>(null);

  useEffect(() => {
    // Check for shared data in URL
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('share');
    if (shared) {
      const decodedStr = unicodeAtob(shared);
      if (decodedStr) {
        try {
          const decoded = JSON.parse(decodedStr);
          setSharedData(decoded);
          // Cleanup URL without refreshing
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error("Invalid share JSON", e);
        }
      }
    }

    const savedEmail = localStorage.getItem('current_warrior_email');
    if (savedEmail) {
      const userData = db.getUserData(savedEmail);
      const ps = userData.profiles || [];
      const isComplete = ps.length > 0;
      
      setUser({ email: savedEmail, onboardingComplete: isComplete });
      setProfiles(ps);
      setGroups(userData.groups || []);
      setHistory(userData.history || []);
      
      if (!isComplete) {
        setView('onboarding');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      db.saveUserData(user.email, { profiles, groups, history });
    }
  }, [user, profiles, groups, history]);

  const handleLogin = (email: string) => {
    const userData = db.getUserData(email);
    const hasProfiles = userData.profiles.length > 0;
    setUser({ email, onboardingComplete: hasProfiles });
    setProfiles(userData.profiles);
    setGroups(userData.groups);
    setHistory(userData.history);
    localStorage.setItem('current_warrior_email', email);
    setView(hasProfiles ? 'dashboard' : 'onboarding');
  };

  const completeOnboarding = (name: string, allergies: string[]) => {
    const newProfile: Profile = { id: crypto.randomUUID(), name, allergies, enabled: true };
    setProfiles([newProfile]);
    setUser(prev => prev ? { ...prev, onboardingComplete: true } : null);
    setView('dashboard');
  };

  const handleImportShared = () => {
    if (!sharedData) return;
    if (sharedData.type === 'profile') {
      const newP = { ...sharedData.data, id: crypto.randomUUID(), enabled: true, groupId: undefined };
      setProfiles(prev => [...prev, newP]);
    } else if (sharedData.type === 'group') {
      const newGId = crypto.randomUUID();
      const newG = { ...sharedData.data, id: newGId, enabled: true };
      setGroups(prev => [...prev, newG]);
      if (sharedData.nestedProfiles) {
        const newPs = sharedData.nestedProfiles.map(p => ({
          ...p,
          id: crypto.randomUUID(),
          enabled: true,
          groupId: newGId
        }));
        setProfiles(prev => [...prev, ...newPs]);
      }
    }
    setSharedData(null);
    setView('profiles');
  };

  const addProfile = (name: string, allergies: string[], groupId?: string) => {
    setProfiles(prev => [...prev, { id: crypto.randomUUID(), name, allergies, enabled: true, groupId }]);
  };

  const editProfile = (id: string, name: string, allergies: string[], groupId?: string) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name, allergies, groupId } : p));
  };

  const editGroup = (id: string, name: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));
  };

  const handleLogout = () => {
    setUser(null);
    setProfiles([]);
    setGroups([]);
    setHistory([]);
    localStorage.removeItem('current_warrior_email');
  };

  const handleScanComplete = (data: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const activeAllergens = Array.from(new Set(
    profiles
      .filter(p => {
        if (!p.enabled) return false;
        if (p.groupId) {
          const group = groups.find(g => g.id === p.groupId);
          return group?.enabled ?? true;
        }
        return true;
      })
      .flatMap(p => p.allergies)
  ));

  if (!user) return <Login onLogin={handleLogin} />;
  
  if (profiles.length === 0 && view !== 'onboarding') {
    setView('onboarding');
  }
  
  if (profiles.length === 0) return <Onboarding onComplete={completeOnboarding} />;

  return (
    <div className="min-h-screen bg-appBg pb-24 relative max-w-md mx-auto flex flex-col shadow-2xl overflow-x-hidden" dir="rtl">
      {/* Shared Import UI */}
      {sharedData && (
        <div className="fixed inset-0 z-[100] bg-dark/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 space-y-6 island-shadow border border-black/5 animate-in zoom-in">
              <div className="w-16 h-16 bg-warriorGreen rounded-[1.5rem] flex items-center justify-center mx-auto mb-2 shadow-xl shadow-warriorGreen/20">
                 <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <div className="text-center">
                 <h3 className="text-2xl font-black text-dark uppercase tracking-tighter">שיתוף זוהה!</h3>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">האם ברצונך לייבא את הנתונים החדשים?</p>
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border border-black/5">
                 <p className="text-xs font-black text-dark uppercase">{sharedData.type === 'profile' ? 'פרופיל:' : 'קבוצה:'} {sharedData.data.name}</p>
                 {sharedData.type === 'group' && <p className="text-[9px] font-bold text-gray-400 mt-1">{sharedData.nestedProfiles?.length} פרופילים כלולים</p>}
              </div>
              <div className="flex gap-2">
                 <button onClick={handleImportShared} className="flex-1 py-4 bg-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">ייבא נתונים</button>
                 <button onClick={() => setSharedData(null)} className="px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase">ביטול</button>
              </div>
           </div>
        </div>
      )}

      {/* Main App Bar */}
      <div className="fixed top-4 left-0 right-0 z-50 px-4 max-w-md mx-auto pointer-events-none">
        <div className="bg-white/95 backdrop-blur island-shadow border border-black/5 rounded-full py-2 px-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-warriorGreen rounded-full flex items-center justify-center font-black text-white text-[10px]">W</div>
            <span className="text-xs font-black text-dark uppercase tracking-tighter">Allergy Warrior</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${activeAllergens.length > 0 ? 'bg-warriorGreen/10 border-warriorGreen/20 text-warriorDarkGreen' : 'bg-gray-100'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${activeAllergens.length > 0 ? 'bg-warriorGreen animate-pulse' : 'bg-gray-400'}`} />
              <span>אלרגיות: {activeAllergens.length}</span>
            </div>
            <div className="w-8 h-8 bg-gray-50 border border-black/5 rounded-full flex items-center justify-center text-[10px] font-bold text-dark">{user.email[0].toUpperCase()}</div>
          </div>
        </div>
      </div>

      <main className="flex-1 mt-16 px-4 py-4 overflow-y-auto">
        {view === 'dashboard' && <Dashboard history={history} onNavigate={() => setView('scan')} activeAllergens={activeAllergens} onScanComplete={handleScanComplete} />}
        {view === 'profiles' && <ProfileManager profiles={profiles} groups={groups} onAddProfile={addProfile} onEditProfile={editProfile} onToggleProfile={(id) => setProfiles(p => p.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x))} onDeleteProfile={(id) => setProfiles(p => p.filter(x => x.id !== id))} onAddGroup={(name) => setGroups(p => [...p, { id: crypto.randomUUID(), name, enabled: true }])} onEditGroup={editGroup} onToggleGroup={(id) => setGroups(p => p.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x))} onDeleteGroup={(id) => { setGroups(p => p.filter(x => x.id !== id)); setProfiles(p => p.map(x => x.groupId === id ? { ...x, groupId: undefined } : x)); }} />}
        {view === 'scan' && (
          <Scanner 
            activeAllergens={activeAllergens} 
            onScanComplete={handleScanComplete} 
            onClose={() => setView('dashboard')} 
            onRecommendationClick={(product) => {
              setSelectedRecommendedProduct(product);
              setView('product-details');
            }}
          />
        )}
        {view === 'history' && <History history={history} />}
        {view === 'account' && <Account user={user} onLogout={handleLogout} profilesCount={profiles.length} historyCount={history.length} />}
        {view === 'product-details' && selectedRecommendedProduct && (
          <ProductDetails 
            product={selectedRecommendedProduct} 
            onBack={() => setView('scan')} 
          />
        )}
      </main>

      <Navigation currentView={view} setView={setView} />
    </div>
  );
}
