
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface Props {
  onLogin: (email: string) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isSimulating, setIsSimulating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) onLogin(email);
  };

  const handleGoogleLogin = async () => {
    setIsSimulating('Google');
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user.email) {
        onLogin(result.user.email);
      }
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setError("התחברות נכשלה. נסה שוב.");
    } finally {
      setIsSimulating(null);
    }
  };

  const simulateSSO = (provider: string) => {
    if (provider === 'Google') {
      handleGoogleLogin();
      return;
    }
    setIsSimulating(provider);
    setTimeout(() => {
      onLogin(`${provider.toLowerCase()}-user@warrior.io`);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-appBg" dir="rtl">
      {isSimulating && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-16 h-16 border-4 border-dark border-t-warriorGreen rounded-full animate-spin mb-6" />
           <p className="font-black text-dark uppercase tracking-widest text-xs">מתחבר באמצעות {isSimulating}...</p>
        </div>
      )}

      <div className="w-full max-w-sm space-y-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center">
          <div className="w-16 h-16 bg-dark rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl -rotate-3">
             <span className="text-3xl font-black text-warriorGreen">W</span>
          </div>
          <h1 className="text-4xl font-black text-dark tracking-tighter uppercase leading-[0.8]">Allergy<br/><span className="text-warriorGreen">Warrior</span></h1>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-4">Safety First • AI Ingredient Guard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-dark uppercase tracking-widest px-1 opacity-60">Warrior Identity</label>
            <input
              type="email"
              required
              className="w-full px-6 py-4 rounded-[1.2rem] bg-white border border-black/5 focus:border-warriorGreen focus:ring-4 focus:ring-warriorGreen/10 outline-none transition-all font-bold text-black placeholder-gray-300"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 rounded-[1.2rem] bg-dark text-white font-black text-xs uppercase tracking-widest hover:bg-warriorGreen hover:text-dark active:scale-95 transition-all shadow-xl"
          >
            Enter Base
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-400"><span className="bg-appBg px-4">OR CONTINUE WITH</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => simulateSSO('Google')}
            className="flex items-center justify-center gap-2 py-4 bg-white border border-black/5 rounded-[1.2rem] font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>
          <button 
            onClick={() => simulateSSO('Apple')}
            className="flex items-center justify-center gap-2 py-4 bg-white border border-black/5 rounded-[1.2rem] font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.96.95-2.06 1.92-3.37 1.92s-1.73-.78-3.28-.78c-1.54 0-2.03.75-3.26.78-1.31.03-2.43-.91-3.41-1.95C1.72 18.2 0 14.41 0 10.74c0-3.66 2.2-5.61 4.35-5.61 1.08 0 2.08.76 2.74.76.66 0 1.83-.91 3.1-.91 1.25 0 2.25.59 2.97 1.62-2.58 1.54-2.15 5.09.43 6.27-.92 2.3-2.13 4.54-3.54 6.81zM11.97 4.19C11.95 2.31 13.62.66 15.39 0c.26 1.86-1.56 3.73-3.42 4.19z"/></svg>
            Apple
          </button>
        </div>

        <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-60 pt-4">
          Strict Privacy • Local Data Storage
        </p>
      </div>
    </div>
  );
};

export default Login;
