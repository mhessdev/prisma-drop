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

    // Enhanced completion provider for Prisma schema (like VSCode extension)
    const completionProvider = monaco.languages.registerCompletionItemProvider('prisma', {
      triggerCharacters: ['@', '=', '"', ' ', '\n', '{'],
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
        const afterCursor = line.substring(position.column - 1);
        const allText = model.getValue();
        const linesBefore = allText.split('\n').slice(0, position.lineNumber - 1);
        
        // Enhanced context detection
        const isInGenerator = isInsideBlock(linesBefore, line, 'generator');
        const isInDatasource = isInsideBlock(linesBefore, line, 'datasource');
        const isInModel = isInsideBlock(linesBefore, line, 'model');
        const isInEnum = isInsideBlock(linesBefore, line, 'enum');
        const isAfterAt = beforeCursor.trim().endsWith('@');
        const isFieldDeclaration = isInModel && /^\s+[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(beforeCursor);
        const isFieldType = isInModel && /^\s+[a-zA-Z_][a-zA-Z0-9_]*\s+$/.test(beforeCursor);
        const isPropertyValue = /=\s*$/.test(beforeCursor);
        const isAfterSpace = beforeCursor.endsWith(' ');
        const isNewLine = beforeCursor.trim() === '';
        const isInsideParens = beforeCursor.includes('(') && !beforeCursor.includes(')');

        let suggestions: any[] = [];

        // Top-level block suggestions
        if (!isInGenerator && !isInDatasource && !isInModel && !isInEnum) {
          if (isNewLine || /^\s*(gen|mod|dat|enu|typ|vie)/.test(line)) {
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
                documentation: 'Define a code generator',
                range,
                sortText: '1'
              },
              {
                label: 'model',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: [
                  'model ${1:User} {',
                  '  id    Int     @id @default(autoincrement())',
                  '  email String  @unique',
                  '  name  String?',
                  '  $0',
                  '}'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a data model',
                range,
                sortText: '2'
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
                sortText: '3'
              },
              {
                label: 'enum',
                kind: monaco.languages.CompletionItemKind.Enum,
                insertText: [
                  'enum ${1:Role} {',
                  '  ${2:USER}',
                  '  ${3:ADMIN}',
                  '  $0',
                  '}'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define an enumeration',
                range,
                sortText: '4'
              }
            );
          }
        }

        // Model field suggestions
        if (isInModel && isNewLine) {
          suggestions.push(
            {
              label: 'id',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'id    ${1|Int,String|} @id @default(${2|autoincrement(),cuid(),uuid()|})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Primary key field',
              range,
              sortText: '1'
            },
            {
              label: 'field',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '${1:fieldName} ${2|String,Int,Boolean,DateTime,Float,Decimal,Json,Bytes|} ${3:@unique}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Basic field',
              range,
              sortText: '2'
            },
            {
              label: 'createdAt',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'createdAt DateTime @default(now())',
              documentation: 'Creation timestamp field',
              range,
              sortText: '3'
            },
            {
              label: 'updatedAt',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'updatedAt DateTime @updatedAt',
              documentation: 'Update timestamp field',
              range,
              sortText: '4'
            }
          );
        }

        // Field types
        if (isFieldType) {
          const fieldTypes = [
            { name: 'String', desc: 'Variable length text' },
            { name: 'Boolean', desc: 'True or false value' },
            { name: 'Int', desc: '32-bit signed integer' },
            { name: 'BigInt', desc: '64-bit signed integer' },
            { name: 'Float', desc: 'Floating point number' },
            { name: 'Decimal', desc: 'High precision decimal' },
            { name: 'DateTime', desc: 'Timestamp' },
            { name: 'Json', desc: 'JSON object' },
            { name: 'Bytes', desc: 'Binary data' },
            { name: 'String?', desc: 'Optional string' },
            { name: 'Int?', desc: 'Optional integer' },
            { name: 'Boolean?', desc: 'Optional boolean' },
            { name: 'DateTime?', desc: 'Optional timestamp' },
            { name: 'String[]', desc: 'Array of strings' },
            { name: 'Int[]', desc: 'Array of integers' }
          ];

          suggestions.push(
            ...fieldTypes.map(type => ({
              label: type.name,
              kind: monaco.languages.CompletionItemKind.TypeParameter,
              insertText: type.name,
              documentation: type.desc,
              range,
              sortText: type.name.includes('?') ? '2' : type.name.includes('[]') ? '3' : '1'
            }))
          );
        }

        // Attributes and functions
        if (isAfterAt) {
          const attributes = [
            { name: 'id', snippet: 'id', desc: 'Defines the primary key' },
            { name: 'unique', snippet: 'unique', desc: 'Defines a unique constraint' },
            { name: 'default', snippet: 'default(${1:value})', desc: 'Sets a default value' },
            { name: 'relation', snippet: 'relation(fields: [${1:fieldName}], references: [${2:id}])', desc: 'Defines a relation' },
            { name: 'updatedAt', snippet: 'updatedAt', desc: 'Auto-updates timestamp' },
            { name: 'map', snippet: 'map("${1:column_name}")', desc: 'Maps to database column' },
            { name: 'db', snippet: 'db.${1:VarChar(255)}', desc: 'Database-specific attribute' },
            { name: 'ignore', snippet: 'ignore', desc: 'Excludes field from client' }
          ];

          suggestions.push(
            ...attributes.map(attr => ({
              label: `@${attr.name}`,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: `@${attr.snippet}`,
              insertTextRules: attr.snippet.includes('$') ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
              documentation: attr.desc,
              range,
              sortText: '1'
            }))
          );
        }

        // Default value functions inside @default()
        if (isInsideParens && beforeCursor.includes('@default(')) {
          const functions = [
            { name: 'autoincrement()', desc: 'Auto-incrementing integer' },
            { name: 'cuid()', desc: 'Collision-resistant unique identifier' },
            { name: 'uuid()', desc: 'UUID v4' },
            { name: 'now()', desc: 'Current timestamp' },
            { name: 'env("DATABASE_URL")', desc: 'Environment variable' },
            { name: 'dbgenerated("expression")', desc: 'Database-generated value' }
          ];

          suggestions.push(
            ...functions.map(func => ({
              label: func.name,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: func.name,
              documentation: func.desc,
              range,
              sortText: '1'
            }))
          );
        }

        // Generator properties
        if (isInGenerator) {
          if (isPropertyValue) {
            if (beforeCursor.includes('provider')) {
              suggestions.push(
                { label: '"prisma-client-js"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"prisma-client-js"', range },
                { label: '"prisma-client-py"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"prisma-client-py"', range }
              );
            } else if (beforeCursor.includes('previewFeatures')) {
              const features = ['relationJoins', 'fullTextSearch', 'postgresqlExtensions', 'views', 'multiSchema'];
              suggestions.push(
                ...features.map(feature => ({
                  label: `"${feature}"`,
                  kind: monaco.languages.CompletionItemKind.Value,
                  insertText: `"${feature}"`,
                  range
                }))
              );
            }
          } else {
            const generatorProps = [
              { name: 'provider', snippet: 'provider = "${1:prisma-client-js}"' },
              { name: 'output', snippet: 'output = "${1:../generated/client}"' },
              { name: 'previewFeatures', snippet: 'previewFeatures = [${1:"relationJoins"}]' },
              { name: 'binaryTargets', snippet: 'binaryTargets = [${1:"native"}]' }
            ];

            suggestions.push(
              ...generatorProps.map(prop => ({
                label: prop.name,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: prop.snippet,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range
              }))
            );
          }
        }

        // Datasource properties
        if (isInDatasource) {
          if (isPropertyValue) {
            if (beforeCursor.includes('provider')) {
              const providers = ['postgresql', 'mysql', 'sqlite', 'sqlserver', 'mongodb', 'cockroachdb'];
              suggestions.push(
                ...providers.map(provider => ({
                  label: `"${provider}"`,
                  kind: monaco.languages.CompletionItemKind.Value,
                  insertText: `"${provider}"`,
                  range
                }))
              );
            }
          } else {
            const datasourceProps = [
              { name: 'provider', snippet: 'provider = "${1:postgresql}"' },
              { name: 'url', snippet: 'url = env("${1:DATABASE_URL}")' },
              { name: 'directUrl', snippet: 'directUrl = env("${1:DIRECT_URL}")' },
              { name: 'shadowDatabaseUrl', snippet: 'shadowDatabaseUrl = env("${1:SHADOW_DATABASE_URL}")' }
            ];

            suggestions.push(
              ...datasourceProps.map(prop => ({
                label: prop.name,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: prop.snippet,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range
              }))
            );
          }
        }

        // Enum values
        if (isInEnum && isNewLine) {
          suggestions.push({
            label: 'enum value',
            kind: monaco.languages.CompletionItemKind.EnumMember,
            insertText: '${1:VALUE}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          });
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
