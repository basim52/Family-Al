import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment.");
}

// -------------------------------------------------------------
// AI API Endpoints
// -------------------------------------------------------------

// 1. Generate task suggestions for a project
app.post("/api/ai/suggest-tasks", async (req: Request, res: Response) => {
  if (!ai) {
    return res.status(500).json({ error: "الرجاء ضبط مفتاح بيئة جيميناي (GEMINI_API_KEY) لتفعيل المستشار الذكي." });
  }

  const { title, description, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: "اسم المشروع مطلوب لتوليد المهام." });
  }

  try {
    const prompt = `أنت مهندس صيانة ومخطط مشاريع عائلية خبير.
قم بإنشاء قائمة بالمهام المقترحة والعملية لمشروع عائلي بالخصائص التالية:
عنوان المشروع: ${title}
الوصف: ${description || "متروك للتخطيط"}
التصنيف: ${category || "صيانة منزلية"}

يرجى توليد قائمة تتألف من 4 إلى 8 مهام دقيقة ومنطقية باللغة العربية يمكن لعائلة تنفيذها (مع تحديد الأولوية لكل مهمة تبعا لأهميتها).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "أنت خبير فني لتخطيط مشاريع العائلة العربية. أنت تخرج دائماً البيانات بنمط هيكلي JSON دقيق يتطابق تماماً مع المخطط (Schema) المعرف لديك للعودة بقائمة مهام عائلية مخصصة.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["tasks"],
          properties: {
            tasks: {
              type: Type.ARRAY,
              description: "قائمة المهام المقترحة للمشروع العائلي",
              items: {
                type: Type.OBJECT,
                required: ["text", "priority"],
                properties: {
                  text: {
                    type: Type.STRING,
                    description: "وصف المهمة المقترحة باللغة العربية بأسلوب عملي واضح ومختصر"
                  },
                  priority: {
                    type: Type.STRING,
                    enum: ["high", "medium", "low"],
                    description: "أولوية المهمة (عالية، متوسطة، منخفضة)"
                  }
                }
              }
            }
          }
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("لم يتم إرجاع استجابة من نموذج الذكاء الاصطناعي.");
    }

    const data = JSON.parse(textOutput.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error generating tasks:", error);
    res.status(500).json({ error: error.message || "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي لتوليد المهام." });
  }
});

// 2. Estimate project budget
app.post("/api/ai/estimate-budget", async (req: Request, res: Response) => {
  if (!ai) {
    return res.status(500).json({ error: "الرجاء ضبط مفتاح بيئة جيميناي (GEMINI_API_KEY) لتفعيل مستشار الميزانية." });
  }

  const { title, description, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: "اسم المشروع مطلوب لحساب الميزانية التقديرية." });
  }

  try {
    const prompt = `أنت مستشار مالي ومسؤول تقدير كلف إنشائية وصيانة ومناسبات للمنازل العربية.
قم بتقدير الميزانية والمصروفات المطلوبة لمشروع عائلي باسم: "${title}" ووصف بـ "${description || "صيانة عامة"}" والمصنف تحت "${category}".
يرجى تقسيم الميزانية إلى بنود منطقية من حيث التكلفة، وتقديم نصيحة عملية لتوفير التكاليف.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "أنت خبير تقدير التكاليف المنزلية وصيانة وعازل ومستلزمات البيوت العربية بالعملة المحلية الفرضية (مثلا: درهم، ريال، جنيه، دينار). يرجى إخراج النتيجة دائماً على هيئة JSON متطابق للـ Schema المحددة.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["totalEstimated", "currency", "items", "advice"],
          properties: {
            totalEstimated: {
              type: Type.NUMBER,
              description: "إجمالي التكلفة التقديرية المقترحة للمشروع كاملاً"
            },
            currency: {
              type: Type.STRING,
              description: "رمز العملة المستخدمة (ريال / جنيه / درهم / دينار)"
            },
            items: {
              type: Type.ARRAY,
              description: "البنود التفصيلية التي تتكون منها التكلفة",
              items: {
                type: Type.OBJECT,
                required: ["item", "estimatedCost", "reason"],
                properties: {
                  item: {
                    type: Type.STRING,
                    description: "اسم البند أو الأداة أو الخدمة المطلوبة (بالعربية)"
                  },
                  estimatedCost: {
                    type: Type.NUMBER,
                    description: "الحجم المالي المقدر لهذا البند"
                  },
                  reason: {
                    type: Type.STRING,
                    description: "سبب الاحتياج أو آلية الصرف المقترحة للبند"
                  }
                }
              }
            },
            advice: {
              type: Type.STRING,
              description: "نصيحة ذهبية عائلية لكيفية التقليل من نفقات هذا المشروع والاعتماد على الجهد العائلي الفردي أو الشراء الجماعي"
            }
          }
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("لم يتم إرجاع استجابة من نموذج الذكاء الاصطناعي لحساب الميزانية.");
    }

    const data = JSON.parse(textOutput.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error estimating budget:", error);
    res.status(500).json({ error: error.message || "حدث خطأ أثناء تقدير الميزانية عبر الذكاء الاصطناعي." });
  }
});

// 2.5. Analyze long-term house development plans with feasibility score
app.post("/api/ai/analyze-plan", async (req: Request, res: Response) => {
  if (!ai) {
    return res.status(500).json({ error: "الرجاء ضبط مفتاح بيئة جيميناي (GEMINI_API_KEY) لتفعيل دراسة الجدوى." });
  }

  const { title, description, category, estimatedCost } = req.body;

  if (!title) {
    return res.status(400).json({ error: "اسم الخطة مطلوب للتحليل." });
  }

  try {
    const prompt = `أنت مهندس استشاري وخبير تخطيط وتطوير عمراني للمنازل والبيوت العائلية الكبرى بالشرق الأوسط.
قم بعمل دراسة جدوى فنية عائلية وفحص دقيق لمشروع تطوير وتوسعة بالمنزل بالتفاصيل التالية:
عنوان خطة التطوير: "${title}"
التوصيف العام: "${description || "تحسين وتطوير عام بمرافق البيت"}"
الفئة المقترحة: "${category || "تطوير عام"}"
التكلفة التقديرية المبدئية: "${estimatedCost || "لم تقرر بعد"} وحدة نقدية"

المطلوب: تقدير درجة واقعية/جدوى الخطة (من 0% إلى 100%)، وتصنيف مستوى الجهد الهندسي/العمالي (منخفض/متوسط/عالٍ)، وبيان خطوات التنفيذ المبرمجة بالترتيب العملي، وتحديد المزايا العائلية والتحديات أو العقبات، مع خلاصة نصيحة فنية واضحة لتنفيذها بسلاسة وتضامن.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "أنت أفضل مستشار تخطيط هندسي واقتصادي للمنازل الأسرية. تخرج مخرجات التحليل والجدوى دائماً كملف JSON متماسك جداً تبعاً للمخطط البنيوي (Schema) المعرف لديك للسلامة والدقة البرمجية.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["score", "effort", "steps", "pros", "cons", "verdict"],
          properties: {
            score: {
              type: Type.NUMBER,
              description: "درجة الجدوى أو الواقعية للخطة العائلية من 0 إلى 100"
            },
            effort: {
              type: Type.STRING,
              enum: ["high", "medium", "low"],
              description: "درجة الجهد الفني والعملي المطلوب لإنجاز التطوير (low, medium, high)"
            },
            steps: {
              type: Type.ARRAY,
              description: "خطوات التنفيذ الهندسية والعملية التفصيلية المرتبة منطقياً",
              items: { type: Type.STRING }
            },
            pros: {
              type: Type.ARRAY,
              description: "المزايا الإيجابية والتأثيرات المفيدة للعائلة والبيت من جراء هذا التطوير",
              items: { type: Type.STRING }
            },
            cons: {
              type: Type.ARRAY,
              description: "التحديات، المخاطر، العوائق أو التكلفة التي قد تواجه العائلة",
              items: { type: Type.STRING }
            },
            verdict: {
              type: Type.STRING,
              description: "خلاصة وحكم الاستشاري الذكي لمجلس العائلة الموقر لإنجاح التمويل والتشغيل"
            }
          }
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("لم يتم إرجاع استجابة من نموذج الذكاء الاصطناعي لتحليل خطة العائلة.");
    }

    const data = JSON.parse(textOutput.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error analyzing plan:", error);
    res.status(500).json({ error: error.message || "حدث خطأ أثناء إجراء دراسة الجدوى الذكية." });
  }
});

// 3. General Chat Advisor for Family Projects
app.post("/api/ai/ask-advisor", async (req: Request, res: Response) => {
  if (!ai) {
    return res.status(500).json({ error: "الرجاء ضبط مفتاح بيئة جيميناي (GEMINI_API_KEY) لتفعيل خبير بيت العائلة." });
  }

  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "الرجاء إدخال رسالة مخصصة." });
  }

  try {
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: "أنت ركن الحكمة ومستشار العائلة العربي المتزن والمحب للتنمية والجمال والتعاون. تساعد أفراد الأسرة في التخطيط لمشاريع بيت العائلة (المنزل المشترك الكبير)، صيانته ورعايته وحل النزاعات المالية والتنظيمية بالعدل والمودة والدعابة والتكامل، ترفع همتهم وتجيب بأسلوب عربي دافئ واضح وجميل وغني بالأمثلة والنصائح والتحفيز."
      }
    });

    // Provide past history context to the chat endpoint if available
    // Otherwise directly sendMessage
    let response;
    if (history && Array.isArray(history) && history.length > 0) {
      // Simplest chat history pattern for @google/genai is appending messages or creating custom content contexts
      // To keep it simple, let's inject history as part of the user request
      let formattedHistory = history.map((h: any) => `${h.role === 'user' ? 'السائل' : 'المستشار'}: ${h.text}`).join("\n");
      let fullPrompt = `سياق محادثاتنا السابقة:\n${formattedHistory}\n\nالسؤال الحالي: ${message}`;
      response = await chat.sendMessage({ message: fullPrompt });
    } else {
      response = await chat.sendMessage({ message: message });
    }

    const textOutput = response.text;
    res.json({ reply: textOutput });
  } catch (error: any) {
    console.error("Error from AI advisor:", error);
    res.status(500).json({ error: error.message || "حدث خطأ في مستشار العائلة الذكي." });
  }
});

// -------------------------------------------------------------
// Vite Dev & Production Asset Serving
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Family House Project Manager Server] started inside port: ${PORT}`);
  });
}

startServer();
