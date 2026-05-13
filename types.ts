export interface Profile {
  id: string;
  name: string;
  allergies: string[];
  enabled: boolean;
  groupId?: string;
}

export interface Group {
  id: string;
  name: string;
  enabled: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  productName: string;
  isSafe: boolean;
  isEdible: boolean;
  allergensFound: string[];
  barcode?: string;
  ingredients?: string[];
}

export interface User {
  email: string;
  onboardingComplete?: boolean;
}

export interface RecommendedProduct {
  name: string;
  reason: string;
  ingredients: string[];
}

export interface AnalysisResult {
  productName: string;
  isSafe: boolean;
  isEdible: boolean;
  allergensFound: string[];
  summary: string;
  barcode?: string;
  ingredients?: string[];
  recommendations?: RecommendedProduct[];
}