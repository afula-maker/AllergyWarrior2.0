
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    productName: {
      type: Type.STRING,
      description: "שם המוצר בעברית",
    },
    isSafe: {
      type: Type.BOOLEAN,
      description: "בטוח?",
    },
    isEdible: {
      type: Type.BOOLEAN,
      description: "אכיל?",
    },
    allergensFound: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "אלרגנים שנמצאו",
    },
    summary: {
      type: Type.STRING,
      description: "סיכום קצר מאוד",
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "שם המוצר המדויק (למשל: צ'יטוס גבינה)" },
          reason: { type: Type.STRING, description: "למה הוא מומלץ (למשל: חטיף תירס ללא רכיבי בוטנים)" },
          ingredients: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "רשימת רכיבים מלאה של המוצר המומלץ"
          }
        },
        required: ["name", "reason", "ingredients"]
      },
      description: "המלצות למוצרים ספציפיים ובטוחים הדומים למוצר שנסרק"
    },
    barcode: {
      type: Type.STRING,
      description: "ברקוד המוצר אם נמצא בתמונה",
    },
    ingredients: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "רשימת רכיבים מלאה",
    },
  },
  required: ["productName", "isSafe", "isEdible", "allergensFound", "summary", "ingredients"],
};

export async function quickIdentify(imageBase64: string): Promise<{ barcode?: string; productName?: string } | null> {
  const prompt = "Identify this product precisely. Return JSON with 'barcode' (if visible) and 'productName' (Specific brand and flavor in Hebrew). If not a product, return empty object.";
  const parts: any[] = [
    { text: prompt },
    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview", 
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            barcode: { type: Type.STRING },
            productName: { type: Type.STRING }
          }
        }
      },
    });
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Quick identify failed", e);
    return null;
  }
}

export async function* analyzeProductStream(
  input: { text?: string; imageBase64?: string },
  activeAllergens: string[]
) {
  // Use Gemini 3 Pro for maximum reasoning capability (ChatGPT-4o equivalent)
  const prompt = `
    Analyze for allergens: ${activeAllergens.join(", ")}.
    Item: ${input.text || "Analyze image"}.
    
    INSTRUCTIONS:
    1. If an image is provided, look for barcodes or text labels. 
    2. Use barcode info or product name to verify ingredients.
    3. If NOT food/drink, isEdible=false.
    4. STRICT RULE: Only set isSafe=false if you find one of the SPECIFIC allergens listed above: (${activeAllergens.join(", ")}).
    5. DO NOT flag other allergens (like gluten or nuts) if they are not in the specified list. Only check for what was requested.
    6. If isSafe=false, provide 2-3 recommendations for REAL, SPECIFIC brand-name products that are widely available and DO NOT contain ONLY the specified allergens: (${activeAllergens.join(", ")}).
    7. Hebrew responses only.
    8. 'allergensFound' array must ONLY contain items from the list: [${activeAllergens.join(", ")}].
  `;

  const contents: any[] = [{ text: prompt }];
  if (input.imageBase64) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: input.imageBase64,
      },
    });
  }

  const result = await ai.models.generateContentStream({
    model: "gemini-3.1-flash-lite-preview",
    contents: { parts: contents },
    config: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
      temperature: 0.1,
    },
  });

  for await (const chunk of result) {
    yield chunk.text;
  }
}

export async function analyzeProduct(
  input: { text?: string; imageBase64?: string },
  activeAllergens: string[]
): Promise<AnalysisResult> {
  const prompt = `
    STRICT Allergic check for: ${activeAllergens.join(", ")}. 
    Item: ${input.text || "See image"}. 
    Use schema. 
    Only flag if ingredients contain one of: [${activeAllergens.join(", ")}]. 
    If safe, return isSafe=true.
    If unsafe, return isSafe=false and provide specific brand-name recommendations that are safe from: [${activeAllergens.join(", ")}].
    'allergensFound' must only contain items from our list.
  `;
  const parts: any[] = [{ text: prompt }];
  if (input.imageBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: input.imageBase64 } });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
    },
  });

  return JSON.parse(response.text.trim());
}
