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

      // Debug: List available files
      console.log('Current working directory:', process.cwd());
      try {
        const nodeModules = await fs.readdir(join(process.cwd(), 'node_modules'));
        console.log('Available packages in node_modules:', nodeModules.slice(0, 10));
        
        if (nodeModules.includes('prisma')) {
          const prismaDir = await fs.readdir(join(process.cwd(), 'node_modules', 'prisma'));
          console.log('Contents of prisma package:', prismaDir);
        }
      } catch (e) {
        console.log('Could not read node_modules:', e);
      }

      // Try different possible paths for Prisma binary
      const possiblePrismaPaths = [
        join(process.cwd(), 'node_modules', '.bin', 'prisma'),
        join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js'),
        'npx prisma', // Use npx as fallback
        'prisma'
      ];
      
      let prismaPath = null;
      
      // Check which path exists
      for (const path of possiblePrismaPaths) {
        try {
          if (path.startsWith('npx') || path === 'prisma') {
            // For npx and global commands, we can't check file existence
            prismaPath = path;
            console.log('Will try command:', path);
            break;
          } else {
            await fs.access(path);
            prismaPath = path;
            console.log('Found Prisma at:', path);
            break;
          }
        } catch {
          console.log('Prisma not found at:', path);
        }
      }
      
      if (!prismaPath) {
        prismaPath = 'npx prisma'; // Last resort fallback
        console.log('Using fallback command:', prismaPath);
      }
      
      const formattedSchema = await new Promise<string>((resolve, reject) => {
        let command;
        if (prismaPath.endsWith('.js')) {
          command = `node "${prismaPath}" format --schema="${tempFile}"`;
        } else if (prismaPath.startsWith('npx')) {
          command = `${prismaPath} format --schema="${tempFile}"`;
        } else {
          command = `"${prismaPath}" format --schema="${tempFile}"`;
        }
        console.log('Executing command:', command);
        
        exec(
          command,
          { 
            cwd: process.cwd(),
            timeout: 15000, // 15 second timeout
            env: { 
              ...process.env,
              FORCE_COLOR: '0',
              NODE_ENV: 'production' // Prevent prisma from trying to install
            }
          },
          async (error, stdout, stderr) => {
            console.log('Command completed');
            console.log('stdout:', stdout);
            console.log('stderr:', stderr);
            
            if (error) {
              console.error('Prisma format error:', error);
              reject(error);
              return;
            }

            try {
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
