import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Category {
  name: string;
  score: number;
}

interface Suggestion {
  category: string;
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categories } = body;

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ error: 'Categories are required and must be an array' }, { status: 400 });
    }

    const prompt = `
      As an expert public speaking coach, provide improvement suggestions for the following categories based on their scores. Give 1-2 concise, actionable suggestions for each category. The total number of suggestions should not exceed 5.

      Categories and scores:
      ${categories.map(cat => `${cat.name}: ${cat.score}/10`).join('\n')}

      Format your response as a JSON array of objects, each with 'category' and 'text' properties. For example:
      [
        {"category": "Content and Structure", "text": "Strengthen your thesis statement by making it more specific and arguable."},
        {"category": "Delivery and Vocal Control", "text": "Practice varying your pitch and tone to add emphasis to key points."}
      ]
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const suggestionsText = response.choices[0].message.content;
    let suggestions: Suggestion[];

    try {
      suggestions = JSON.parse(suggestionsText || '[]');
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return NextResponse.json({ error: 'Invalid response from AI' }, { status: 500 });
    }

    // Ensure we have no more than 5 suggestions
    suggestions = suggestions.slice(0, 5);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}