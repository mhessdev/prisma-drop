import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { textBeforeCursor, currentLine, language = 'prisma' } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `Complete this ${language} code:

${textBeforeCursor}${currentLine}

Provide only the completion for the current line or next logical code block. Consider:
- Prisma schema syntax
- Model definitions and relationships  
- Field types and attributes
- Proper indentation and formatting

Return only the code to insert, no explanations or markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a code completion assistant for ${language} schemas. Provide concise, contextually relevant code completions. Only return the code that should be inserted, no explanations or markdown formatting.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.1,
      stream: false
    });

    const result = completion.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ completion: result });
  } catch (error) {
    console.error('AI completion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate completion' },
      { status: 500 }
    );
  }
}
