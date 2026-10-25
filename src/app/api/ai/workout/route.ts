import { NextResponse } from "next/server";
import { buildFallbackPlan, type AiRequest, type PlanInput } from "@/lib/plans";

const GEMINI_MODEL = "gemini-3.5-flash-lite";

function extractJson(text: string): PlanInput | null {
  let cleaned = text.trim();
  // strip ```json fences if present
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (parsed && Array.isArray(parsed.days) && parsed.days.length) {
      return parsed as PlanInput;
    }
    return null;
  } catch {
    return null;
  }
}

async function callGemini(req: AiRequest, key: string): Promise<PlanInput | null> {
  const prompt = `You are FORGE Athletics' elite strength & conditioning coach.
Design a workout plan as STRICT JSON for this athlete:
- Goal: ${req.goal} (bulk = hypertrophy/muscle gain, cut = fat loss, recomp = body recomposition, strength = maximal strength)
- Experience level: ${req.level}
- Training days per week: ${req.daysPerWeek}
- Equipment available: ${req.equipment}
${req.notes ? `- Athlete notes: ${req.notes}` : ""}

Rules:
- Exactly ${req.daysPerWeek} training days.
- 4–7 exercises per day, real exercise names.
- sets/reps/rest as short strings (e.g. "4", "6-8", "90s", "2 min").
- Include a one-line coaching cue in "notes" for key lifts when helpful.
- "summary" must be one or two sentences.

Respond with ONLY valid JSON (no markdown) in exactly this shape:
{"title": string, "summary": string, "days": [{"label": "Day 1", "focus": string, "exercises": [{"name": string, "sets": string, "reps": string, "rest": string, "notes": string}]}]}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
      signal: AbortSignal.timeout(20000),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  const plan = extractJson(text);
  if (!plan) return null;
  plan.goal = req.goal;
  plan.level = req.level;
  return plan;
}

export async function POST(req: Request) {
  let body: AiRequest;
  try {
    body = (await req.json()) as AiRequest;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const request: AiRequest = {
    goal: body.goal || "recomp",
    level: body.level || "intermediate",
    daysPerWeek: Math.min(6, Math.max(3, Number(body.daysPerWeek) || 4)),
    equipment: body.equipment || "full gym",
    notes: body.notes,
  };

  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      const plan = await callGemini(request, key);
      if (plan) return NextResponse.json({ plan, engine: "gemini" });
    } catch {
      // fall through to deterministic engine
    }
  }

  return NextResponse.json({
    plan: buildFallbackPlan(request),
    engine: key ? "fallback" : "local",
  });
}
