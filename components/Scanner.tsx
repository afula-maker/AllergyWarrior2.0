
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeProductStream } from '../services/geminiService';
import { AnalysisResult, HistoryItem, RecommendedProduct } from '../types';
import { getCachedProductByBarcode, getCachedProductByName, cacheProduct, normalizeId } from '../services/firebase';

interface Props {
  activeAllergens: string[];
  onScanComplete: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  onClose?: () => void;
  onRecommendationClick?: (product: RecommendedProduct) => void;
}

const Scanner: React.FC<Props> = ({ activeAllergens, onScanComplete, onClose, onRecommendationClick }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<{ title: string; message: string; action: string } | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('NotSupportedError');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err: any) {
      setError({
        title: "תקלה בגישה למצלמה",
        message: "לא הצלחנו להפעיל את המצלמה שלך. בדוק את הגדרות הפרטיות.",
        action: "נסה לרענן את הדף"
      });
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
    await performAnalysis({ imageBase64: base64Image });
  };

  const performAnalysis = async (input: { text?: string; imageBase64?: string }) => {
    if (activeAllergens.length === 0) {
      setError({ title: "אין אלרגיות", message: "הגדר לפחות אלרגיה אחת בפרופיל.", action: "חזור לפרופילים" });
      return;
    }
    setIsAnalyzing(true);
    setStreamedText('');
    setResult(null);
    setError(null);
    setIsFromCache(false);
    
    try {
      // 1. Quick Identify (Flash) to check cache
      if (input.imageBase64) {
        setStreamedText('מזהה מוצר...');
        const identity = await import('../services/geminiService').then(m => m.quickIdentify(input.imageBase64!));
        
        if (identity) {
          let cached = null;
          if (identity.barcode) {
            cached = await getCachedProductByBarcode(identity.barcode);
          } else if (identity.productName) {
            // First try by exact name
            cached = await getCachedProductByName(identity.productName);
            // If not found, try by normalized ID
            if (!cached) {
              const nid = normalizeId(undefined, identity.productName);
              cached = await getCachedProductByBarcode(nid);
            }
          }

          if (cached) {
            setIsFromCache(true);
            const allergensFound = (cached.ingredients || []).filter(ing => 
              activeAllergens.some(all => ing.toLowerCase().includes(all.toLowerCase()))
            );
            
            const cachedResult: AnalysisResult = {
              productName: cached.productName,
              isSafe: allergensFound.length === 0,
              isEdible: cached.isEdible,
              allergensFound: allergensFound,
              summary: `נמצא במאגר הענן! ${allergensFound.length > 0 ? 'מכיל אלרגנים.' : 'נראה בטוח.'}`,
              barcode: cached.barcode,
              ingredients: cached.ingredients
            };

            setResult(cachedResult);
            setShowDetails(true);
            onScanComplete({
              productName: cachedResult.productName,
              isSafe: cachedResult.isSafe,
              isEdible: cachedResult.isEdible,
              allergensFound: cachedResult.allergensFound,
              barcode: cachedResult.barcode,
              ingredients: cachedResult.ingredients
            });
            setIsAnalyzing(false);
            return;
          }
        }
      }

      // 2. Fallback to Full Analysis (Pro)
      let fullJson = '';
      const stream = analyzeProductStream(input, activeAllergens);
      setShowDetails(true);
      
      for await (const chunk of stream) {
        fullJson += chunk;
        setStreamedText(fullJson);
      }
      
      const parsed: AnalysisResult = JSON.parse(fullJson.trim());
      
      // Client-side safety guard: Filter allergens found to ONLY include active ones 
      // and re-calculate isSafe based on the filtered list.
      const actualAllergensFound = (parsed.allergensFound || []).filter(all => 
        activeAllergens.some(active => all.toLowerCase().includes(active.toLowerCase()) || active.toLowerCase().includes(all.toLowerCase()))
      );
      parsed.allergensFound = actualAllergensFound;
      parsed.isSafe = actualAllergensFound.length === 0;

      setResult(parsed);

      // 3. Cache the result if it's a valid product
      if (parsed.isEdible && parsed.ingredients) {
        cacheProduct({
          barcode: parsed.barcode,
          productName: parsed.productName,
          ingredients: parsed.ingredients,
          isEdible: parsed.isEdible,
          lastAnalyzed: new Date().toISOString()
        });
      }

      onScanComplete({
        productName: parsed.productName,
        isSafe: parsed.isSafe,
        isEdible: parsed.isEdible,
        allergensFound: parsed.allergensFound,
        barcode: parsed.barcode,
        ingredients: parsed.ingredients
      });
    } catch (err) {
      console.error(err);
      setError({ title: "שגיאת ניתוח", message: "לא הצלחנו לקרוא את רשימת הרכיבים.", action: "נסה לצלם שוב" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const rimColor = isAnalyzing 
    ? 'border-white animate-pulse' 
    : result 
      ? !result.isEdible 
        ? 'border-white shadow-[inset_0_0_120px_rgba(255,255,255,0.4)]'
        : result.isSafe ? 'border-warriorGreen shadow-[inset_0_0_120px_rgba(34,197,94,0.4)]' : 'border-red-500 shadow-[inset_0_0_120px_rgba(239,68,68,0.4)]'
      : 'border-transparent';

  return (
    <div className="fixed inset-0 z-[60] bg-black overflow-hidden flex flex-col max-w-md mx-auto" dir="rtl">
      <button onClick={onClose} className="absolute top-8 right-8 z-[70] w-12 h-12 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform shadow-2xl">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
      </button>

      <div className="flex-1 relative">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <div className={`absolute inset-0 border-[12px] transition-all duration-1000 pointer-events-none z-10 ${rimColor}`} />
        {!result && !isAnalyzing && !error && <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-0.5 bg-warriorGreen/50 shadow-[0_0_15px_#22c55e] animate-bounce pointer-events-none" />}
        {!error && !result && !isAnalyzing && (
          <div className="absolute bottom-32 inset-x-0 flex justify-center z-20">
            <button onClick={captureAndAnalyze} className="w-24 h-24 rounded-full flex items-center justify-center transition-all p-1.5 border-4 border-warriorGreen">
              <div className="w-full h-full rounded-full flex items-center justify-center bg-white">
                 <div className="w-6 h-6 bg-dark rounded-full"></div>
              </div>
            </button>
          </div>
        )}
      </div>

      {(result || isAnalyzing) && (
        <div className={`absolute bottom-0 inset-x-0 transition-transform duration-500 ease-out z-30 ${showDetails ? 'translate-y-0' : 'translate-y-[calc(100%-120px)]'}`}>
          <div className={`bg-white rounded-t-[3rem] min-h-[180px] pb-14 border-t-8 premium-shadow ${result && !result.isEdible ? 'border-white' : 'border-warriorGreen'}`}>
            <button onClick={() => setShowDetails(!showDetails)} className="w-full h-12 flex flex-col items-center justify-center">
              <div className="w-16 h-1 bg-gray-100 rounded-full mb-1" />
              <svg className={`h-6 w-6 transition-transform ${showDetails ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>

            <div className="px-10 flex justify-between items-center h-14">
               <h3 className="font-black text-dark text-xl uppercase tracking-tighter truncate max-w-[70%]">
                 {isAnalyzing && !result ? 'מנתח מוצר בשידור חי...' : result?.productName}
               </h3>
               {result && (
                 <div className="flex flex-col items-end gap-1">
                   <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full ${!result.isEdible ? 'bg-gray-400 text-white' : result.isSafe ? 'bg-warriorGreen text-white' : 'bg-red-500 text-white'}`}>
                     {!result.isEdible ? 'לא אכיל' : result.isSafe ? 'בטוח' : 'מסוכן'}
                   </span>
                   {isFromCache && <span className="text-[8px] font-bold text-warriorGreen uppercase tracking-widest">מזוהה מהענן ⚡</span>}
                 </div>
               )}
            </div>

            <div className={`px-10 mt-8 space-y-6 transition-opacity duration-300 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
              {!result && isAnalyzing ? (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded-full w-1/2 animate-pulse" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">הלוחם חוקר את הרכיבים...</p>
                </div>
              ) : result && !result.isEdible ? (
                <div className="bg-gray-50 p-8 rounded-3xl border border-black/5 text-center">
                   <p className="text-dark text-lg font-black leading-tight mb-2">זה אינו מוצר אכיל</p>
                   <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">אנא נסה לסרוק מוצר מזון</p>
                </div>
              ) : (
                <>
                  {!result?.isSafe && result?.allergensFound.length ? (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">רכיבים מסוכנים:</p>
                      <div className="flex flex-wrap gap-2">
                        {result?.allergensFound.map(a => (
                          <span key={a} className="px-4 py-2 bg-dark text-warriorGreen text-[11px] font-black uppercase rounded-2xl border border-warriorGreen/10">{a}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="bg-gray-50 p-6 rounded-3xl border border-black/5">
                    <p className="text-dark text-sm font-bold leading-relaxed">{result?.summary}</p>
                  </div>

                  {result && !result.isSafe && result.recommendations && result.recommendations.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-warriorGreen rounded-full flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-[10px] font-black text-dark uppercase tracking-widest">המלצות למוצרים בטוחים:</p>
                      </div>
                      <div className="grid gap-3">
                        {result.recommendations.map((rec, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => onRecommendationClick?.(rec)}
                            className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between text-right hover:border-warriorGreen/50 transition-colors active:scale-95"
                          >
                            <div className="flex flex-col gap-1 min-w-0">
                               <p className="text-xs font-black text-dark truncate">{rec.name}</p>
                               <p className="text-[9px] font-bold text-gray-400 truncate">{rec.reason}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setResult(null); setShowDetails(false); setStreamedText(''); }} className="flex-1 py-5 bg-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl">
                  סריקה חדשה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-10 rounded-[3rem] text-center shadow-2xl z-[80] w-[85%] border-t-8 border-red-500">
          <h3 className="text-xl font-black text-dark mb-2 tracking-tight">{error.title}</h3>
          <p className="text-gray-500 font-bold mb-8 text-sm">{error.message}</p>
          <button onClick={() => { setError(null); startCamera(); }} className="w-full py-5 bg-dark text-white rounded-2xl font-black text-xs uppercase shadow-xl">נסה שוב</button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Scanner;
