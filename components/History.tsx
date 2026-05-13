
import React from 'react';
import { HistoryItem } from '../types';

interface Props {
  history: HistoryItem[];
}

const History: React.FC<Props> = ({ history }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-bold text-gray-800">היסטוריית סריקות</h2>
        <span className="text-xs font-bold text-gray-400 uppercase">{history.length} פריטים</span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
          <p className="text-gray-400">טרם בוצעו סריקות.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-[2rem] border border-green-50 shadow-sm flex items-center gap-4 group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.isSafe ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {item.isSafe ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-800 truncate pl-2 capitalize">{item.productName || 'מוצר לא ידוע'}</h4>
                  <span className={`text-[10px] font-black uppercase tracking-tighter shrink-0 ${item.isSafe ? 'text-green-600' : 'text-red-600'}`}>
                    {item.isSafe ? 'בטוח' : 'מסוכן'}
                  </span>
                </div>
                <div className="flex justify-between items-end mt-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {new Date(item.timestamp).toLocaleDateString('he-IL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {!item.isSafe && item.allergensFound.length > 0 && (
                    <div className="flex gap-1">
                      {item.allergensFound.slice(0, 2).map(a => (
                        <span key={a} className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
