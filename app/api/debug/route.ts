import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const result: any = {
      cwd: process.cwd(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        LAMBDA_RUNTIME_DIR: process.env.LAMBDA_RUNTIME_DIR,
      }
    };

    // Check if node_modules exists
    try {
      const nodeModulesPath = join(process.cwd(), 'node_modules');
      const nodeModules = await fs.readdir(nodeModulesPath);
      result.nodeModules = nodeModules.slice(0, 20);
      
      // Check for Prisma specifically
      if (nodeModules.includes('prisma')) {
        const prismaPath = join(nodeModulesPath, 'prisma');
        result.prismaContents = await fs.readdir(prismaPath);
        
        // Check for build directory
        if (result.prismaContents.includes('build')) {
          const buildPath = join(prismaPath, 'build');
          result.prismaBuildContents = await fs.readdir(buildPath);
        }
      }
      
      // Check .bin directory
      if (nodeModules.includes('.bin')) {
        const binPath = join(nodeModulesPath, '.bin');
        const binContents = await fs.readdir(binPath);
        result.binContents = binContents;
      }
    } catch (e) {
      result.nodeModulesError = e.message;
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
