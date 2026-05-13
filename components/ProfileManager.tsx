
import React, { useState } from 'react';
import { Profile, Group } from '../types';

interface Props {
  profiles: Profile[];
  groups: Group[];
  onAddProfile: (name: string, allergies: string[], groupId?: string) => void;
  onEditProfile: (id: string, name: string, allergies: string[], groupId?: string) => void;
  onToggleProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  onAddGroup: (name: string) => void;
  onEditGroup: (id: string, name: string) => void;
  onToggleGroup: (id: string) => void;
  onDeleteGroup: (id: string) => void;
}

const COMMON_ALLERGENS = ["חלב", "ביצים", "בוטנים", "אגוזים", "סויה", "חיטה", "גלוטן", "שומשום", "דגים", "פירות ים", "חרדל", "סלרי"];

/**
 * Robust Unicode-safe Base64 encoding for Hebrew characters.
 */
function unicodeBtoa(str: string) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error("B64 encoding failed", e);
    return "";
  }
}

const ProfileManager: React.FC<Props> = ({ 
  profiles, groups, onAddProfile, onEditProfile, onToggleProfile, onDeleteProfile, 
  onAddGroup, onEditGroup, onToggleGroup, onDeleteGroup 
}) => {
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [sharingData, setSharingData] = useState<{ type: 'profile' | 'group', data: any, nestedProfiles?: Profile[] } | null>(null);
  
  const [formData, setFormData] = useState({ name: '', allergies: [] as string[], groupId: '' });
  const [groupFormData, setGroupFormData] = useState({ name: '' });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const handleToggleAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy) ? prev.allergies.filter(a => a !== allergy) : [...prev.allergies, allergy]
    }));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.allergies.length > 0) {
      if (editingProfile) {
        onEditProfile(editingProfile.id, formData.name, formData.allergies, formData.groupId || undefined);
      } else {
        onAddProfile(formData.name, formData.allergies, formData.groupId || undefined);
      }
      resetProfileForm();
    }
  };

  const startEditProfile = (p: Profile) => {
    setEditingProfile(p);
    setFormData({ 
      name: p.name, 
      allergies: p.allergies, 
      groupId: p.groupId || '' 
    });
    setShowAddProfile(true);
  };

  const resetProfileForm = () => {
    setShowAddProfile(false);
    setEditingProfile(null);
    setFormData({ name: '', allergies: [], groupId: '' });
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupFormData.name) {
      if (editingGroup) {
        onEditGroup(editingGroup.id, groupFormData.name);
      } else {
        onAddGroup(groupFormData.name);
      }
      setShowAddGroup(false);
      setEditingGroup(null);
      setGroupFormData({ name: '' });
    }
  };

  const handleShareGroup = (g: Group) => {
    const nested = profiles.filter(p => p.groupId === g.id);
    setSharingData({ type: 'group', data: g, nestedProfiles: nested });
  };

  const handleShareProfile = (p: Profile) => {
    setSharingData({ type: 'profile', data: p });
  };

  const getShareLink = () => {
    if (!sharingData) return '';
    try {
      const jsonStr = JSON.stringify(sharingData);
      const encoded = unicodeBtoa(jsonStr);
      if (!encoded) return '';
      // Use origin and pathname to construct a clean URL
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('share', encoded);
      return url.toString();
    } catch (e) {
      console.error("Link generation failed", e);
      return '';
    }
  };

  const shareLink = getShareLink();

  const renderProfileCard = (profile: Profile) => {
    const group = groups.find(g => g.id === profile.groupId);
    const isGroupDisabled = group && !group.enabled;
    const effectiveEnabled = profile.enabled && !isGroupDisabled;

    return (
      <div key={profile.id} className={`bg-white p-5 rounded-[2rem] border island-shadow transition-all relative ${effectiveEnabled ? 'border-black/5' : 'opacity-40 grayscale'}`}>
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            <button onClick={() => onDeleteProfile(profile.id)} className="text-gray-200 hover:text-red-500 transition-colors p-1" title="מחק">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button onClick={() => startEditProfile(profile)} className="text-gray-200 hover:text-blue-500 transition-colors p-1" title="ערוך">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={() => handleShareProfile(profile)} className="text-gray-200 hover:text-warriorGreen transition-colors p-1" title="שתף">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
          </div>
          <div className="flex-1 flex flex-col items-end">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => onToggleProfile(profile.id)} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${profile.enabled ? 'bg-warriorGreen text-white' : 'bg-gray-100 text-gray-400'}`}>{profile.enabled ? 'פעיל' : 'כבוי'}</button>
              <h4 className="font-black text-dark text-lg uppercase tracking-tight">{profile.name}</h4>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${effectiveEnabled ? 'bg-dark text-warriorGreen' : 'bg-gray-100 text-gray-300'}`}>{profile.name[0].toUpperCase()}</div>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end mt-2">
              {profile.allergies.map(a => (<span key={a} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${effectiveEnabled ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-300'}`}>{a}</span>))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 py-6 animate-in slide-in-from-right duration-500 pb-10">
      {sharingData && (
        <div className="fixed inset-0 z-[110] bg-dark/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 space-y-8 island-shadow border border-black/5 relative overflow-hidden">
              <button onClick={() => setSharingData(null)} className="absolute top-6 left-6 text-gray-300 hover:text-dark">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="text-center">
                 <h3 className="text-2xl font-black text-dark uppercase tracking-tighter">שיתוף Warrior</h3>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">שלח לינק או סרוק את הקוד</p>
              </div>
              <div className="flex justify-center">
                 <div className="p-4 bg-white rounded-3xl border border-black/5 shadow-inner">
                    {shareLink ? (
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareLink)}`} className="w-56 h-56" alt="Share QR" />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center text-red-500 font-bold text-xs">שגיאה ביצירת לינק</div>
                    )}
                 </div>
              </div>
              <div className="space-y-3">
                 <button 
                  onClick={() => { 
                    if (!shareLink) return;
                    navigator.clipboard.writeText(shareLink); 
                    alert('הלינק הועתק בהצלחה!'); 
                  }} 
                  disabled={!shareLink}
                  className="w-full py-5 bg-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl disabled:opacity-50"
                 >
                   העתק לינק לשיתוף
                 </button>
                 <p className="text-center text-[9px] font-black text-warriorGreen uppercase tracking-widest leading-relaxed">
                   הלינק כולל את הפרופיל שבחרת <br/>ומאפשר ייבוא מיידי למכשיר אחר
                 </p>
              </div>
           </div>
        </div>
      )}

      <div className="px-1">
        <h2 className="text-3xl font-black text-dark tracking-tighter uppercase leading-[0.85] mb-2">Warrior<br/><span className="text-warriorGreen">Profiles</span></h2>
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">ניהול פרופילים וקבוצות</p>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-dark uppercase tracking-widest">קבוצות</h3>
          <button onClick={() => { setEditingGroup(null); setGroupFormData({ name: '' }); setShowAddGroup(true); }} className="w-8 h-8 bg-dark text-white rounded-full flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
        </div>

        {showAddGroup && (
          <form onSubmit={handleGroupSubmit} className="bg-white p-6 rounded-[2rem] border island-shadow space-y-4 animate-in zoom-in">
            <h4 className="text-[10px] font-black uppercase text-dark">קבוצה חדשה</h4>
            <input autoFocus className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:border-warriorGreen outline-none text-black font-bold text-sm" placeholder="שם הקבוצה" value={groupFormData.name} onChange={e => setGroupFormData({ name: e.target.value })} />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-dark text-white py-3 rounded-xl text-xs font-black uppercase">שמור</button>
              <button type="button" onClick={() => setShowAddGroup(false)} className="px-4 py-3 text-gray-400 text-xs font-bold uppercase">ביטול</button>
            </div>
          </form>
        )}

        {groups.map(group => {
          const isCollapsed = collapsedGroups.has(group.id);
          const nestedProfiles = profiles.filter(p => p.groupId === group.id);
          return (
            <div key={group.id} className="space-y-3">
              <div className="bg-white p-4 rounded-2xl border border-black/5 flex items-center justify-between island-shadow cursor-pointer" onClick={() => setCollapsedGroups(prev => { const n = new Set(prev); n.has(group.id) ? n.delete(group.id) : n.add(group.id); return n; })}>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => onDeleteGroup(group.id)} className="p-1 text-gray-200 hover:text-red-500"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  <button onClick={() => handleShareGroup(group)} className="p-1 text-gray-200 hover:text-warriorGreen"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></button>
                  <button onClick={() => onToggleGroup(group.id)} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${group.enabled ? 'bg-warriorGreen/10 text-warriorDarkGreen' : 'bg-gray-50 text-gray-400'}`}>{group.enabled ? 'פעיל' : 'כבוי'}</button>
                </div>
                <div className="flex items-center gap-3"><span className={`font-black text-sm uppercase ${group.enabled ? 'text-dark' : 'text-gray-300'}`}>{group.name}</span><svg className={`h-4 w-4 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
              </div>
              {!isCollapsed && nestedProfiles.map(renderProfileCard)}
            </div>
          );
        })}
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-dark uppercase tracking-widest">פרופילים נפרדים</h3>
          <button onClick={() => { resetProfileForm(); setShowAddProfile(true); }} className="w-8 h-8 bg-warriorGreen text-dark rounded-full flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
        </div>

        {showAddProfile && (
          <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-[2.5rem] border island-shadow space-y-6 animate-in zoom-in">
            <h4 className="text-[10px] font-black uppercase text-dark">{editingProfile ? 'עריכת פרופיל' : 'פרופיל חדש'}</h4>
            <input autoFocus className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:border-warriorGreen outline-none text-black font-bold text-sm" placeholder="שם הפרופיל" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase">בחר אלרגיות</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 hide-scrollbar">
                {COMMON_ALLERGENS.map(a => (
                  <label key={a} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.allergies.includes(a) ? 'bg-dark border-dark text-warriorGreen' : 'bg-gray-50 border-transparent text-gray-400 font-bold'}`}>
                    <input type="checkbox" className="hidden" checked={formData.allergies.includes(a)} onChange={() => handleToggleAllergy(a)} />
                    <span className="text-xs font-black uppercase">{a}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase">קבוצה (אופציונלי)</label>
              <select className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:border-warriorGreen outline-none text-black font-bold text-sm" value={formData.groupId} onChange={e => setFormData({ ...formData, groupId: e.target.value })}>
                <option value="">ללא קבוצה</option>
                {groups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-warriorGreen text-dark py-4 rounded-xl text-xs font-black uppercase shadow-lg shadow-warriorGreen/20">
                {editingProfile ? 'עדכן פרופיל' : 'צור פרופיל'}
              </button>
              <button type="button" onClick={resetProfileForm} className="px-4 py-4 text-gray-400 text-xs font-bold uppercase">ביטול</button>
            </div>
          </form>
        )}

        {profiles.filter(p => !p.groupId).map(renderProfileCard)}
      </section>
    </div>
  );
};

export default ProfileManager;
