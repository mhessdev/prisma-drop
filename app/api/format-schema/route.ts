import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  console.log('Format schema API called');
  
  try {
    const { schema } = await request.json();
    console.log('Received schema length:', schema?.length);

    if (!schema || typeof schema !== 'string') {
      console.log('Invalid schema provided');
      return NextResponse.json(
        { error: 'Invalid schema provided' },
        { status: 400 }
      );
    }

    // Create a temporary file
    const tempId = randomBytes(16).toString('hex');
    const tempFile = join(tmpdir(), `prisma-schema-${tempId}.prisma`);
    console.log('Temp file path:', tempFile);

    try {
      // Write schema to temp file
      await fs.writeFile(tempFile, schema, 'utf8');
      console.log('Schema written to temp file');

      // Format using Prisma CLI
      const formattedSchema = await new Promise<string>((resolve, reject) => {
        const command = `npx prisma format --schema="${tempFile}"`;
        console.log('Executing command:', command);
        
        exec(
          command,
          { 
            cwd: process.cwd(),
            timeout: 10000, // 10 second timeout
            env: { ...process.env, FORCE_COLOR: '0' } // Disable colors in output
          },
          async (error, stdout, stderr) => {
            console.log('Command completed');
            console.log('stdout:', stdout);
            console.log('stderr:', stderr);
            
            if (error) {
              console.error('Prisma format error:', error);
              console.error('Error code:', error.code);
              console.error('Error signal:', error.signal);
              reject(error);
              return;
            }

            try {
              // Read the formatted content
              const formatted = await fs.readFile(tempFile, 'utf8');
              console.log('Formatted schema length:', formatted.length);
              resolve(formatted);
            } catch (readError) {
              console.error('Error reading formatted file:', readError);
              reject(readError);
            }
          }
        );
      });

      return NextResponse.json({ formattedSchema });
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFile);
        console.log('Temp file cleaned up');
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError);
      }
    }
  } catch (error) {
    console.error('Format schema error:', error);
    return NextResponse.json(
      { error: 'Failed to format schema', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
