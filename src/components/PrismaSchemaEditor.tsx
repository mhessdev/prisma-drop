'use client'

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Database, RefreshCw, PaintBucket, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// Dynamically import Monaco Editor with no SSR
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="text-center">
        <svg width="48" height="60" viewBox="0 0 58 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 animate-pulse">
          <path fillRule="evenodd" clipRule="evenodd" d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z" fill="white"/>
        </svg>
        <p className="text-sm text-gray-400">Loading editor...</p>
      </div>
    </div>
  ),
});

interface PrismaSchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const PrismaSchemaEditor = ({ value, onChange }: PrismaSchemaEditorProps) => {
  const editorRef = useRef<any>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [lastPush, setLastPush] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);



  // Helper function to determine if we're inside a specific block
  const isInsideBlock = (linesBefore: string[], currentLine: string, blockType: string): boolean => {
    let openBlocks = 0;
    let inTargetBlock = false;

    for (const line of linesBefore) {
      const trimmed = line.trim();
      if (trimmed.startsWith(blockType)) {
        inTargetBlock = true;
        openBlocks = 1;
      } else if (inTargetBlock) {
        if (trimmed.includes('{')) openBlocks++;
        if (trimmed.includes('}')) openBlocks--;
        if (openBlocks === 0) inTargetBlock = false;
      }
    }

    // Check current line too
    const currentTrimmed = currentLine.trim();
    if (currentTrimmed.includes('{') && inTargetBlock) openBlocks++;
    if (currentTrimmed.includes('}') && inTargetBlock) openBlocks--;

    return inTargetBlock && openBlocks > 0;
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Register Prisma language with comprehensive syntax highlighting
    monaco.languages.register({ id: 'prisma' });

    // Enhanced Prisma language definition
    monaco.languages.setMonarchTokensProvider('prisma', {
      tokenizer: {
        root: [
          // Comments
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          
          // Keywords
          [/\b(generator|datasource|model|enum|type|view)\b/, 'keyword.control'],
          [/\b(provider|url|relationMode|binaryTargets|previewFeatures|output|directUrl|shadowDatabaseUrl)\b/, 'keyword.other'],
          
          // Data types
          [/\b(String|Boolean|Int|BigInt|Float|Decimal|DateTime|Json|Bytes|Unsupported)\b/, 'type.primitive'],
          
          // Attributes
          [/@@?[a-zA-Z_]\w*/, 'annotation'],
          
          // String literals
          [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-terminated string
          [/"/, 'string', '@string_double'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'], // non-terminated string
          [/'/, 'string', '@string_single'],
          
          // Numbers
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/\d+/, 'number'],
          
          // Environment variables
          [/env\s*\(\s*"[^"]*"\s*\)/, 'variable.env'],
          
          // Relations and field references
          [/\b[A-Z][a-zA-Z0-9_]*\b/, 'type.model'],
          [/\b[a-z][a-zA-Z0-9_]*\b/, 'identifier'],
          
          // Operators and punctuation
          [/[?]/, 'operator.optional'],
          [/\[\s*\]/, 'operator.array'],
          [/[{}()\[\]]/, 'delimiter.bracket'],
          [/[,;]/, 'delimiter'],
          [/[:=]/, 'operator'],
        ],
        
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],
        
        string_double: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ],
        
        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop']
        ],
      }
    });

    // Prisma-branded dark theme
    monaco.editor.defineTheme('prisma-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword.control', foreground: '7f9cf5', fontStyle: 'bold' }, // indigo-400
        { token: 'keyword.other', foreground: '5a67d8' }, // indigo-600
        { token: 'type.primitive', foreground: '71e8df', fontStyle: 'bold' }, // teal-400
        { token: 'type.model', foreground: '16a394' }, // teal-600
        { token: 'annotation', foreground: '667eea' }, // indigo-500
        { token: 'string', foreground: '92efe6' }, // teal-300
        { token: 'string.escape', foreground: '04c8bb' }, // teal-500
        { token: 'comment', foreground: 'a0aec0', fontStyle: 'italic' }, // gray-500
        { token: 'number', foreground: '667eea' }, // indigo-500
        { token: 'number.float', foreground: '667eea' }, // indigo-500
        { token: 'variable.env', foreground: '16a394' }, // teal-600
        { token: 'operator.optional', foreground: 'e2e8f0' }, // gray-300
        { token: 'operator.array', foreground: 'e2e8f0' }, // gray-300
        { token: 'identifier', foreground: 'e2e8f0' }, // gray-300
        { token: 'delimiter.bracket', foreground: 'e2e8f0' }, // gray-300
        { token: 'delimiter', foreground: 'cbd5e0' }, // gray-400
        { token: 'operator', foreground: 'e2e8f0' }, // gray-300
      ],
      colors: {
        'editor.background': '#1a202c', // gray-900
        'editor.foreground': '#e2e8f0', // gray-300
        'editorLineNumber.foreground': '#718096', // gray-600
        'editorLineNumber.activeForeground': '#e2e8f0', // gray-300
        'editor.selectionBackground': '#2d3748', // gray-800
        'editor.selectionHighlightBackground': '#4a5568', // gray-700
        'editor.wordHighlightBackground': '#4a5568', // gray-700
        'editor.wordHighlightStrongBackground': '#2d3748', // gray-800
        'editorCursor.foreground': '#e2e8f0', // gray-300
        'editorBracketMatch.background': '#2d374850',
        'editorBracketMatch.border': '#5a67d8', // indigo-600
        'editor.lineHighlightBackground': '#2d3748', // gray-800
        'editorGutter.background': '#1a202c', // gray-900
        'editorWhitespace.foreground': '#4a5568', // gray-700
        'editorIndentGuide.background': '#4a5568', // gray-700
        'editorIndentGuide.activeBackground': '#718096', // gray-600
        'editorRuler.foreground': '#4a5568', // gray-700
      }
    });

    monaco.editor.setTheme('prisma-dark');

    // Comprehensive completion provider for Prisma schema
    const completionProvider = monaco.languages.registerCompletionItemProvider('prisma', {
      triggerCharacters: ['@', '=', '"'],
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const line = model.getLineContent(position.lineNumber);
        const beforeCursor = line.substring(0, position.column - 1);
        const allText = model.getValue();
        const linesBefore = allText.split('\n').slice(0, position.lineNumber - 1);
        
        // Determine context
        const isInGenerator = isInsideBlock(linesBefore, line, 'generator');
        const isInDatasource = isInsideBlock(linesBefore, line, 'datasource');
        const isInModel = isInsideBlock(linesBefore, line, 'model');
        const isInEnum = isInsideBlock(linesBefore, line, 'enum');
        const isAfterAt = beforeCursor.trim().endsWith('@');
        const isFieldType = isInModel && !isAfterAt && /^\s+\w+\s*$/.test(beforeCursor);
        const isPropertyValue = /=\s*$/.test(beforeCursor);

        let suggestions: any[] = [];

        // Block-level suggestions (only at top level)
        if (!isInGenerator && !isInDatasource && !isInModel && !isInEnum && 
            /^\s*(gen|mod|dat|enu|$)/.test(line)) {
          suggestions.push(
            {
              label: 'generator',
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: [
                'generator ${1:client} {',
                '  provider = "prisma-client-js"',
                '  $0',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a generator',
              range,
              sortText: '1generator'
            },
            {
              label: 'model',
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: [
                'model ${1:User} {',
                '  id        String   @id @default(cuid())',
                '  email     String   @unique',
                '  name      String?',
                '  createdAt DateTime @default(now())',
                '  updatedAt DateTime @updatedAt',
                '  $0',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a new data model',
              range,
              sortText: '1model'
            },
            {
              label: 'datasource',
              kind: monaco.languages.CompletionItemKind.Module,
              insertText: [
                'datasource ${1:db} {',
                '  provider = "${2:postgresql}"',
                '  url      = env("${3:DATABASE_URL}")',
                '  $0',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a datasource',
              range,
              sortText: '1datasource'
            },
            {
              label: 'enum',
              kind: monaco.languages.CompletionItemKind.Enum,
              insertText: [
                'enum ${1:Status} {',
                '  ${2:ACTIVE}',
                '  ${3:INACTIVE}',
                '  $0',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create an enumeration',
              range,
              sortText: '1enum'
            }
          );
        }

        // Generator properties
        if (isInGenerator && !isAfterAt) {
          if (isPropertyValue) {
            // Provider values
            if (beforeCursor.includes('provider')) {
              suggestions.push(
                { label: '"prisma-client-js"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"prisma-client-js"', range },
                { label: '"prisma-client"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"prisma-client"', range }
              );
            }
            // Engine type values
            else if (beforeCursor.includes('engineType')) {
              suggestions.push(
                { label: '"library"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"library"', range },
                { label: '"binary"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"binary"', range }
              );
            }
            // Module format values
            else if (beforeCursor.includes('moduleFormat')) {
              suggestions.push(
                { label: '"cjs"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"cjs"', range },
                { label: '"esm"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"esm"', range }
              );
            }
          } else {
            // Generator property names
            suggestions.push(
              { label: 'provider', kind: monaco.languages.CompletionItemKind.Property, insertText: 'provider = ', range, sortText: '1provider' },
              { label: 'output', kind: monaco.languages.CompletionItemKind.Property, insertText: 'output = "${1:./generated/client}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, sortText: '2output' },
              { label: 'previewFeatures', kind: monaco.languages.CompletionItemKind.Property, insertText: 'previewFeatures = [${1:"feature"}]', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, sortText: '3previewFeatures' },
              { label: 'engineType', kind: monaco.languages.CompletionItemKind.Property, insertText: 'engineType = "${1:library}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, sortText: '4engineType' },
              { label: 'binaryTargets', kind: monaco.languages.CompletionItemKind.Property, insertText: 'binaryTargets = [${1:"native"}]', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, sortText: '5binaryTargets' },
              { label: 'moduleFormat', kind: monaco.languages.CompletionItemKind.Property, insertText: 'moduleFormat = "${1:cjs}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, sortText: '6moduleFormat' }
            );
          }
        }

        // Datasource properties
        if (isInDatasource && !isAfterAt) {
          if (isPropertyValue) {
            if (beforeCursor.includes('provider')) {
              suggestions.push(
                { label: '"postgresql"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"postgresql"', range },
                { label: '"mysql"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"mysql"', range },
                { label: '"sqlite"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"sqlite"', range },
                { label: '"sqlserver"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"sqlserver"', range },
                { label: '"mongodb"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"mongodb"', range },
                { label: '"cockroachdb"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"cockroachdb"', range }
              );
            }
          } else {
            suggestions.push(
              { label: 'provider', kind: monaco.languages.CompletionItemKind.Property, insertText: 'provider = ', range },
              { label: 'url', kind: monaco.languages.CompletionItemKind.Property, insertText: 'url = env("${1:DATABASE_URL}")', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range }
            );
          }
        }

        // Field types in models
        if (isFieldType) {
          suggestions.push(
            ...['String', 'Boolean', 'Int', 'BigInt', 'Float', 'Decimal', 'DateTime', 'Json', 'Bytes'].map(type => ({
              label: type,
              kind: monaco.languages.CompletionItemKind.TypeParameter,
              insertText: type,
              documentation: `${type} field type`,
              range,
              sortText: `1${type}`
            }))
          );
        }

        // Attributes (triggered by @)
        if (isAfterAt || (isInModel && beforeCursor.trim().endsWith('@'))) {
          suggestions.push(
            // Field attributes
            {
              label: '@id',
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: '@id',
              documentation: 'Defines the primary key',
              range,
              sortText: '1@id'
            },
            {
              label: '@unique',
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: '@unique',
              documentation: 'Defines a unique constraint',
              range,
              sortText: '1@unique'
            },
            {
              label: '@default',
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: '@default(${1:value})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Sets a default value',
              range,
              sortText: '1@default'
            },
            {
              label: '@relation',
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: '@relation(fields: [${1:fieldName}], references: [${2:id}])',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Defines a relation between models',
              range,
              sortText: '1@relation'
            },
            {
              label: '@updatedAt',
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: '@updatedAt',
              documentation: 'Automatically sets the field to now() when the record is updated',
              range,
              sortText: '1@updatedAt'
            },
            {
              label: '@map',
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: '@map("${1:column_name}")',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Maps the field to a specific database column',
              range,
              sortText: '1@map'
            },

            // Default value functions
            {
              label: 'autoincrement()',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'autoincrement()',
              documentation: 'Creates a sequence of integers in the underlying database',
              range,
              sortText: '4autoincrement'
            },
            {
              label: 'cuid()',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'cuid()',
              documentation: 'Generates a globally unique identifier',
              range,
              sortText: '4cuid'
            },
            {
              label: 'uuid()',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'uuid()',
              documentation: 'Generates a globally unique identifier',
              range,
              sortText: '4uuid'
            },
            {
              label: 'now()',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'now()',
              documentation: 'Sets a timestamp of the time when a record is created',
              range,
              sortText: '4now'
            },

            // Common field snippets
            {
              label: 'id (Int autoincrement)',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'id ${1:Int} @id @default(autoincrement())',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Integer ID field with auto-increment',
              range,
              sortText: '5id-int'
            },
            {
              label: 'id (String cuid)',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'id ${1:String} @id @default(cuid())',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'String ID field with CUID',
              range,
              sortText: '5id-string'
            },
            {
              label: 'email field',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'email ${1:String} @unique',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Unique email field',
              range,
              sortText: '5email'
            },
            {
              label: 'timestamps',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Standard timestamp fields',
              range,
              sortText: '5timestamps'
            },
            {
              label: 'relation field',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '${1:author}   ${2:User} @relation(fields: [${3:authorId}], references: [${4:id}])\n  ${3:authorId} ${5:String}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Relation field with foreign key',
              range,
              sortText: '5relation'
            }
          );
        }

        return { suggestions };
      }
    });



    // Enhanced hover provider
    const hoverProvider = monaco.languages.registerHoverProvider('prisma', {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word) return;

        const documentation: { [key: string]: string } = {
          'model': '**Model** - Represents an entity in your application domain and maps to a table (relational databases) or collection (MongoDB)',
          'generator': '**Generator** - Determines which assets are created from your Prisma schema',
          'datasource': '**Datasource** - Tells Prisma what database you use and how to connect to it',
          'enum': '**Enum** - Defines a list of possible values for a field',
          '@id': '**@id** - Defines a single-field ID on the model',
          '@unique': '**@unique** - Defines a unique constraint for this field',
          '@default': '**@default** - Defines a default value for this field',
          '@relation': '**@relation** - Defines meta information about the relation',
          '@updatedAt': '**@updatedAt** - Automatically stores the time when a record was last updated',
          '@map': '**@map** - Maps a field name or enum value from the Prisma schema to a column or document field name in the database',
          'String': '**String** - Variable length text',
          'Boolean': '**Boolean** - True or false value',
          'Int': '**Int** - 32-bit signed integer',
          'BigInt': '**BigInt** - 64-bit signed integer',
          'Float': '**Float** - Floating point number',
          'Decimal': '**Decimal** - High precision floating point number',
          'DateTime': '**DateTime** - Timestamp',
          'Json': '**Json** - JSON object',
          'Bytes': '**Bytes** - Raw bytes (binary data)',
          'autoincrement': '**autoincrement()** - Creates a sequence of integers in the underlying database',
          'cuid': '**cuid()** - Generates a globally unique identifier based on the cuid spec',
          'uuid': '**uuid()** - Generates a globally unique identifier based on the UUID spec',
          'now': '**now()** - Sets a timestamp of the time when a record is created'
        };

        if (documentation[word.word]) {
          return {
            range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
            contents: [{ value: documentation[word.word] }]
          };
        }
      }
    });

    // Removed auto-trigger suggestions to prevent duplicate suggestions

    // Add document formatting provider
    monaco.languages.registerDocumentFormattingEditProvider('prisma', {
      provideDocumentFormattingEdits: (model: any) => {
        const value = model.getValue();
        // Simple Prisma formatting rules
        const formatted = value
          .split('\n')
          .map((line: string) => {
            // Remove trailing whitespace
            line = line.trimEnd();
            
            // Handle indentation for model contents
            if (line.trim().match(/^(id|email|name|title|content|published|author|authorId|createdAt|updatedAt|provider|url)\s+/)) {
              // Field definitions should be indented with 2 spaces
              const trimmed = line.trim();
              return `  ${trimmed}`;
            }
            
            // Block-level keywords should not be indented
            if (line.trim().match(/^(model|generator|datasource|enum)\s+/)) {
              return line.trim();
            }
            
            // Closing braces should not be indented
            if (line.trim() === '}') {
              return '}';
            }
            
            return line;
          })
          .join('\n');

        return [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ];
      },
    });



    // Add Prisma-specific commands
    editor.addAction({
      id: 'prisma.format',
      label: 'Format Prisma Schema',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      run: () => {
        handleFormat();
      }
    });
  };

  const handleFormat = async () => {
    if (!editorRef.current) return;
    
    setIsFormatting(true);

    try {
      const currentValue = editorRef.current.getValue();
      
      // Call the official Prisma formatter via API
      const response = await fetch('/api/format-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schema: currentValue }),
      });

      if (response.ok) {
        const { formattedSchema } = await response.json();
        editorRef.current.setValue(formattedSchema);
        onChange(formattedSchema);
        
        // Show success toast
        toast({
          title: "Schema formatted successfully!",
          description: "Your schema has been formatted using Prisma's official formatter",
        });
      } else {
        // Fallback to Monaco's document formatting
        await editorRef.current.trigger('format', 'editor.action.formatDocument', {});
        
        // Show fallback warning
        toast({
          title: "Schema formatted (fallback)",
          description: "Used Monaco editor formatting as Prisma formatter was unavailable",
        });
      }
    } catch (error) {
      console.error('Error formatting:', error);
      
      // Fallback to Monaco's document formatting
      try {
        await editorRef.current.trigger('format', 'editor.action.formatDocument', {});
        
        // Show fallback warning
        toast({
          title: "Schema formatted (fallback)",
          description: "Used Monaco editor formatting due to an error with Prisma formatter",
        });
      } catch (fallbackError) {
        console.error('Fallback formatting failed:', fallbackError);
        
        // Show error toast
        toast({
          title: "Formatting failed",
          description: "Unable to format schema. Please check your syntax.",
          variant: "destructive",
        });
      }
    } finally {
      setIsFormatting(false);
    }
  };

  const handlePushToDb = async () => {
    setIsPushing(true);
    try {
      // Simulate push to database
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastPush(new Date());
    } catch (error) {
      console.error('Error pushing to database:', error);
    } finally {
      setIsPushing(false);
    }
  };



  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <svg width="48" height="60" viewBox="0 0 58 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 animate-pulse">
            <path fillRule="evenodd" clipRule="evenodd" d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z" fill="white"/>
          </svg>
          <p className="text-sm text-gray-400">Initializing editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Left Sidebar */}
      <Card className="w-16 border-r border-gray-700 bg-gray-800 rounded-none flex flex-col items-center py-4 space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePushToDb}
          disabled={isPushing}
          className="w-12 h-12 p-0 flex flex-col items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700"
          title="Push schema to database (prisma db push)"
        >
          {isPushing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          <span className="text-xs mt-1">Push</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleFormat}
          disabled={isFormatting}
          className={`w-12 h-12 p-0 flex flex-col items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 ${
            isFormatting ? 'bg-indigo-900/50 text-indigo-300' : ''
          }`}
          title={isFormatting ? "Formatting schema..." : "Format schema (Shift+Alt+F)"}
        >
          {isFormatting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PaintBucket className="h-4 w-4" />
          )}
          <span className="text-xs mt-1">{isFormatting ? "..." : "Format"}</span>
        </Button>



        {lastPush && (
          <div className="mt-4 flex flex-col items-center">
            <Badge variant="secondary" className="text-xs rotate-90 whitespace-nowrap bg-gray-700 text-gray-300">
              Last push
            </Badge>
            <span className="text-xs text-gray-400 mt-2 transform rotate-90 whitespace-nowrap">
              {lastPush.toLocaleTimeString()}
            </span>
          </div>
        )}
      </Card>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          <Editor
            height="100%"
            language="prisma"
            value={value}
            onChange={(newValue) => onChange(newValue || '')}
            onMount={handleEditorDidMount}
            theme="prisma-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              suggest: {
                showKeywords: true,
                showSnippets: true,
                showFunctions: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showModules: true,
                showProperties: true,
                showEnums: true,
                showEnumMembers: true,
                showTypeParameters: true,
                snippetsPreventQuickSuggestions: false,
                filterGraceful: true,
                localityBonus: true,
              },
              quickSuggestions: {
                other: 'inline',
                comments: false,
                strings: false,
              },
              quickSuggestionsDelay: 300,
              parameterHints: { 
                enabled: true,
                cycle: true
              },
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoIndent: 'full',
              acceptSuggestionOnCommitCharacter: true,
              acceptSuggestionOnEnter: 'smart',
              tabCompletion: 'on',
              wordBasedSuggestions: 'allDocuments',
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always',
              matchBrackets: 'always',
              selectionHighlight: true,
              occurrencesHighlight: 'singleFile',
              cursorBlinking: 'blink',
              cursorStyle: 'line',
              smoothScrolling: true,
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true,
              multiCursorModifier: 'ctrlCmd',
              mouseWheelZoom: true,
              linkedEditing: true,
              codeLens: true,
              inlineSuggest: {
                enabled: false,
                showToolbar: 'never',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PrismaSchemaEditor;
