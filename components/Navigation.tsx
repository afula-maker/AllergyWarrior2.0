
import React from 'react';

interface Props {
  currentView: string;
  setView: (view: any) => void;
}

const Navigation: React.FC<Props> = ({ currentView, setView }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'profiles', label: 'Profiles', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'scan', label: 'Scan', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
    { id: 'history', label: 'History', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'account', label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-black/5 flex justify-between items-end h-24 px-4 pb-4 z-50">
      {tabs.map((tab) => {
        const isScan = tab.id === 'scan';
        const isActive = currentView === tab.id;

        if (isScan) {
          return (
            <div key={tab.id} className="relative flex-1 flex flex-col items-center">
               <button
                onClick={() => setView(tab.id)}
                className={`flex items-center justify-center transition-all absolute -top-12 w-16 h-16 rounded-[1.8rem] shadow-2xl ${
                  isActive ? 'bg-warriorGreen scale-110 shadow-warriorGreen/40' : 'bg-dark hover:bg-warriorGreen'
                }`}
              >
                <svg className={`h-8 w-8 ${isActive ? 'text-dark' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <span className={`text-[8px] font-black uppercase tracking-widest mt-6 ${isActive ? 'text-dark' : 'text-gray-300'}`}>
                {tab.label}
              </span>
            </div>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 transition-all pb-1 ${
              isActive ? 'text-dark' : 'text-gray-300'
            }`}
          >
            <div className={`p-2 rounded-2xl transition-colors ${isActive ? 'bg-warriorGreen/10' : ''}`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 3 : 2} d={tab.icon} />
              </svg>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
