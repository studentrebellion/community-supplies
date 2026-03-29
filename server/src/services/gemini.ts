const GEMINI_MODEL = 'gemini-2.5-flash-lite';

interface GeminiPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

async function callGemini(parts: GeminiPart[], systemInstruction?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in .env');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body: any = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  // Retry up to 5 times for rate limits
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      const wait = (attempt + 1) * 5000; // 5s, 10s, 15s, 20s, 25s
      console.log(`Gemini rate limited, retrying in ${wait / 1000}s (attempt ${attempt + 1}/5)...`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini API error (${response.status}):`, errText);
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No text returned from Gemini');
    }

    return text;
  }

  throw new Error('Gemini API rate limit exceeded after retries. Try again in a minute.');
}

// Analyze an image and return structured item data
export async function draftItemFromImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<{
  name: string;
  description: string;
  category: string;
  condition: string;
  houseRules: string[];
}> {
  const systemPrompt = `You are an assistant that helps people list items for a neighborhood sharing library.
Analyze the image and return a JSON object with these fields:
- name: A concise, descriptive name for the item(s) shown
- description: A brief, matter-of-fact 1-2 sentence description of what the item is and its condition. Do not use marketing language, superlatives, or exclamation marks. Just state what it is plainly.
- category: One of: books, tools, home-diy, art-craft, camping-outdoors, sports, beach-surf, party-events, kitchen, kids, misc
- condition: One of: excellent, good, fair

Return ONLY valid JSON, no markdown or explanation.`;

  const result = await callGemini([
    {
      inline_data: {
        mime_type: mimeType,
        data: imageBase64,
      },
    },
    { text: 'Analyze this image and draft a supply listing.' },
  ], systemPrompt);

  // Parse JSON from response (handle possible markdown wrapping)
  const jsonStr = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}

// Generate a text description for an illustration prompt
export async function generateIllustrationPrompt(itemName: string, description: string): Promise<string> {
  const result = await callGemini([
    {
      text: `Create a brief, vivid description for generating a minimalist hand-drawn illustration of: "${itemName}". Context: ${description}. The illustration should be a simple line drawing with a warm, friendly feel, suitable for a community sharing library catalog. Return only the description, no explanation.`,
    },
  ]);

  return result.trim();
}

// Generate an illustration image for a supply item
export async function generateIllustration(itemName: string, description: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    // Step 1: Generate the illustration prompt via Gemini
    const illustrationPrompt = await generateIllustrationPrompt(itemName, description);
    console.log(`Generating illustration for "${itemName}" with prompt: ${illustrationPrompt.substring(0, 80)}...`);

    // Step 2: Generate the image using Gemini's native image generation
    const imageModel = 'gemini-2.5-flash-image';
    const imageUrl = `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent?key=${apiKey}`;

    const response = await fetch(imageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a simple black and white line drawing illustration on a clean white background. No color, no shading, no text or labels. Minimalist pen-and-ink style. Subject: ${illustrationPrompt}`,
          }],
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini image generation error (${response.status}):`, errText);
      return null;
    }

    const data = await response.json();
    // Find the image part in the response
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData);
    
    if (!imagePart?.inlineData?.data) {
      console.error('No image data in Gemini response. Parts:', JSON.stringify(parts.map((p: any) => Object.keys(p))));
      return null;
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    return `data:${mimeType};base64,${imagePart.inlineData.data}`;
  } catch (err: any) {
    console.error('Illustration generation failed:', err.message);
    return null;
  }
}

// Scan a bookshelf image and detect titles
export async function scanBookshelf(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<{
  title: string;
  author: string;
}[]> {
  const systemPrompt = `You are a book detection assistant. Analyze the image of a bookshelf and identify as many book titles and authors as you can.
Return a JSON array of objects with "title" and "author" fields. If you can't determine the author, use an empty string.
Return ONLY valid JSON, no markdown or explanation.`;

  const result = await callGemini([
    {
      inline_data: {
        mime_type: mimeType,
        data: imageBase64,
      },
    },
    { text: 'Identify all books visible in this image.' },
  ], systemPrompt);

  const jsonStr = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}
