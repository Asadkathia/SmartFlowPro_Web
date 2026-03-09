import { NextResponse } from "next/server"

interface EnhanceRequest {
  description: string
}

interface OpenAIResult {
  text: string | null
  error?: string
}

function normalizeForCompare(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
}

function isMateriallyDifferent(candidate: string, original: string): boolean {
  return normalizeForCompare(candidate) !== normalizeForCompare(original)
}

function extractTextFromResponsePayload(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  if (Array.isArray(payload?.output_text)) {
    const joined = payload.output_text
      .map((item: any) => (typeof item === "string" ? item : item?.text || ""))
      .join(" ")
      .trim()
    if (joined) return joined
  }

  if (Array.isArray(payload?.output)) {
    const chunks: string[] = []

    for (const item of payload.output) {
      if (!Array.isArray(item?.content)) continue
      for (const contentItem of item.content) {
        if (typeof contentItem?.text === "string" && contentItem.text.trim()) {
          chunks.push(contentItem.text.trim())
        }
      }
    }

    if (chunks.length > 0) return chunks.join("\n").trim()
  }

  return ""
}

async function callOpenAI(description: string, forceExpansion: boolean): Promise<OpenAIResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { text: null, error: "OPENAI_API_KEY is not configured." }
  }

  const userPrompt = forceExpansion
    ? [
        "Rewrite this into a technician-ready service work-order description.",
        "This is NOT a job posting or hiring ad.",
        "Keep all original facts, but make it clearer and more actionable for onsite execution.",
        "Include, when available: customer issue, diagnostic focus, expected scope of work, required access/safety notes, and completion intent.",
        "Keep it concise (2-5 sentences), plain text only, no markdown headings or bullet lists.",
        "Return only the improved work-order description text.",
        "",
        description,
      ].join("\n")
    : description

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: [
              "You rewrite CRM field-service notes into technician-ready work-order descriptions.",
              "Treat 'job description' as service job scope for a technician visit, not recruitment content.",
              "Keep original facts and intent.",
              "Do not invent customer names, dates, or technical details.",
              "If details are missing, avoid fabrication and keep language operational and practical.",
              "Write concise plain text only, without markdown headings or bullet lists.",
              "Return only the improved work-order description.",
            ].join("\n")
          }],
        },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: forceExpansion
              ? userPrompt
              : [
                "Improve this technician service job note into a clear work-order description.",
                "Do not produce recruitment/hiring language.",
                "Return plain text only.",
                "",
                description,
              ].join("\n")
          }],
        },
      ],
    }),
  })

  if (!response.ok) {
    const rawError = await response.text()
    return {
      text: null,
      error: `OpenAI request failed (${response.status}): ${rawError.slice(0, 200)}`,
    }
  }

  const data = await response.json()
  const raw = extractTextFromResponsePayload(data)
  if (!raw) return { text: null, error: "OpenAI returned an empty response." }
  return { text: raw.trim() }
}

async function enhanceWithOpenAI(description: string): Promise<OpenAIResult> {
  const firstPass = await callOpenAI(description, false)
  if (!firstPass.text) return firstPass

  if (isMateriallyDifferent(firstPass.text, description)) {
    return firstPass
  }

  const secondPass = await callOpenAI(description, true)
  if (!secondPass.text) return firstPass
  if (isMateriallyDifferent(secondPass.text, description)) {
    return secondPass
  }

  return {
    text: null,
    error: "AI returned text too similar to the input. Try with more details.",
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EnhanceRequest
    const input = body?.description?.trim() || ""

    if (!input) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    const result = await enhanceWithOpenAI(input)
    if (!result.text) {
      return NextResponse.json(
        { error: result.error || "AI enhancement unavailable." },
        { status: 502 }
      )
    }

    return NextResponse.json({ enhancedDescription: result.text })
  } catch {
    return NextResponse.json({ error: "Failed to enhance description" }, { status: 500 })
  }
}
