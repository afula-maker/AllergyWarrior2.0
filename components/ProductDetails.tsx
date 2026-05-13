
import React from 'react';
import { RecommendedProduct } from '../types';

interface Props {
  product: RecommendedProduct;
  onBack: () => void;
}

const ProductDetails: React.FC<Props> = ({ product, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-left duration-500" dir="rtl">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-white island-shadow rounded-full flex items-center justify-center text-dark border border-black/5 active:scale-90 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-2xl font-black text-dark tracking-tighter uppercase">פרטי מוצר</h2>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 island-shadow border border-black/5 space-y-8 overflow-hidden relative">
        <div className="space-y-4 text-center pb-6 border-b border-gray-100 relative z-10">
           <div className="w-16 h-16 bg-warriorGreen/10 rounded-[1.2rem] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-warriorGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
           </div>
           <h3 className="text-2xl font-black text-dark">{product.name}</h3>
           <p className="text-[10px] font-bold text-warriorGreen uppercase tracking-widest leading-relaxed">{product.reason}</p>
        </div>

        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-warriorGreen rounded-full" />
              <p className="text-[10px] font-black text-dark uppercase tracking-widest">רשימת רכיבים מלאה:</p>
           </div>
           <div className="bg-gray-50 rounded-3xl p-6 border border-black/5">
              <div className="flex flex-wrap gap-2">
                 {product.ingredients.map((ing, idx) => (
                    <span key={idx} className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
                       {ing}
                    </span>
                 ))}
              </div>
           </div>
        </div>

        <div className="pt-6">
           <div className="bg-warriorGreen/5 border border-warriorGreen/10 rounded-2xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-warriorGreen shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-[10px] font-bold text-warriorDarkGreen leading-relaxed">
                 הלוחם אימת שמוצר זה אינו מכיל את האלרגנים הפעילים שלך. תמיד מומלץ לוודא את הכתוב על גבי האריזה לפני השימוש.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
