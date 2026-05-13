
import React from 'react';
import { User } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
  profilesCount: number;
  historyCount: number;
}

const Account: React.FC<Props> = ({ user, onLogout, profilesCount, historyCount }) => {
  const menuItems = [
    { 
      label: 'עריכת פרופיל', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      color: 'bg-blue-50 text-blue-500'
    },
    { 
      label: 'אבטחה ופרטיות', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
      color: 'bg-purple-50 text-purple-500'
    },
    { 
      label: 'עזרה ותמיכה', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      color: 'bg-orange-50 text-orange-500'
    }
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-left duration-500 pb-10">
      <div className="text-center space-y-4 py-8">
        <div className="w-24 h-24 bg-warriorGreen/10 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-lg text-warriorDarkGreen text-4xl font-black">
          {user.email[0].toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-black text-dark tracking-tighter uppercase">{user.email}</h2>
          <p className="text-warriorGreen text-xs font-black uppercase tracking-widest mt-1">Status: Active</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-black/5 island-shadow text-center transform transition-transform active:scale-95 cursor-pointer">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Profiles</p>
          <p className="text-2xl font-black text-dark">{profilesCount}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-black/5 island-shadow text-center transform transition-transform active:scale-95 cursor-pointer">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Scans</p>
          <p className="text-2xl font-black text-dark">{historyCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-black/5 island-shadow overflow-hidden">
        {menuItems.map((item, idx) => (
          <button 
            key={idx}
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 active:scale-[0.99] transition-all border-b border-gray-50 last:border-0"
            onClick={() => console.log(`${item.label} clicked`)}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center`}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {item.icon}
                </svg>
              </div>
              <span className="font-bold text-gray-700 text-sm">{item.label}</span>
            </div>
            <svg className="h-5 w-5 text-gray-300 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ))}
        
        <button 
          onClick={onLogout}
          className="w-full p-5 flex items-center justify-between hover:bg-red-50 active:bg-red-100 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="font-bold text-sm uppercase tracking-tight">התנתקות</span>
          </div>
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-400 font-black uppercase tracking-widest mt-8">
        v2.5.0 • Allergy Assistant Protocol
      </p>
    </div>
  );
};

export default Account;
