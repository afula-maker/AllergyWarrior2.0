
import { Profile, Group, HistoryItem } from '../types';

interface UserData {
  profiles: Profile[];
  groups: Group[];
  history: HistoryItem[];
}

export const db = {
  getStorageKey(email: string) {
    return `allergy_warrior_db_${email.toLowerCase()}`;
  },

  saveUserData(email: string, data: UserData) {
    const key = this.getStorageKey(email);
    localStorage.setItem(key, JSON.stringify(data));
  },

  getUserData(email: string): UserData {
    const key = this.getStorageKey(email);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      profiles: [],
      groups: [],
      history: []
    };
  }
};
