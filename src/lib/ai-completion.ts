import { OpenAI } from 'openai';

interface CompletionCache {
  insertText: string;
  range: {
    startLineNumber: number;
    endLineNumber: number;
    startColumn: number;
    endColumn: number;
  };
  position: {
    lineNumber: number;
    column: number;
  };
}

export class AICompletionProvider {
  private openai: OpenAI;
  private cachedSuggestions: CompletionCache[] = [];
  private readonly cacheSize = 8;
  private fetchingInterval?: NodeJS.Timeout;
  private timeoutRef?: NodeJS.Timeout;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Only for demo - use API route in production
    });
  }

  async generateCompletion(
    textBeforeCursor: string,
    currentLine: string,
    language: string = 'prisma'
  ): Promise<string> {
    const prompt = this.buildPrompt(textBeforeCursor, currentLine, language);
    
    try {
      const completion = await this.openai.chat.completions.create({
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
        max_tokens: 50,
        temperature: 0.1,
        stream: false
      });

      return completion.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('AI completion error:', error);
      return '';
    }
  }

  private buildPrompt(textBeforeCursor: string, currentLine: string, language: string): string {
    return `Complete this ${language} code:

${textBeforeCursor}${currentLine}

Provide only the completion for the current line or next logical code block. Consider:
- Prisma schema syntax
- Model definitions and relationships
- Field types and attributes
- Proper indentation and formatting`;
  }

  async provideCachedCompletion(
    model: any,
    position: any
  ): Promise<any[]> {
    const word = model.getWordUntilPosition(position);
    const line = model.getLineContent(position.lineNumber);
    const textBeforeCursor = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });

    // Filter cached suggestions that are relevant to current position
    const relevantSuggestions = this.cachedSuggestions.filter(suggestion => {
      const isNearby = Math.abs(suggestion.position.lineNumber - position.lineNumber) <= 2;
      const hasRelevantText = suggestion.insertText.length > 0;
      return isNearby && hasRelevantText;
    });

    return relevantSuggestions.map(suggestion => ({
      insertText: suggestion.insertText,
      range: {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      },
      kind: 18, // InlineCompletion
      sortText: 'ai-completion'
    }));
  }

  startFetching(model: any, position: any): void {
    this.clearFetching();

    this.timeoutRef = setTimeout(() => {
      this.fetchingInterval = setInterval(async () => {
        const line = model.getLineContent(position.lineNumber);
        const textBeforeCursor = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        const completion = await this.generateCompletion(textBeforeCursor, line);
        
        if (completion) {
          const newSuggestion: CompletionCache = {
            insertText: completion,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column,
              endColumn: position.column
            },
            position: {
              lineNumber: position.lineNumber,
              column: position.column
            }
          };

          this.cachedSuggestions.unshift(newSuggestion);
          this.cachedSuggestions = this.cachedSuggestions.slice(0, this.cacheSize);
        }
      }, 1000); // Fetch every second when idle
    }, 500); // Start after 500ms of inactivity
  }

  clearFetching(): void {
    if (this.fetchingInterval) {
      clearInterval(this.fetchingInterval);
      this.fetchingInterval = undefined;
    }
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
      this.timeoutRef = undefined;
    }
  }

  dispose(): void {
    this.clearFetching();
    this.cachedSuggestions = [];
  }
}
