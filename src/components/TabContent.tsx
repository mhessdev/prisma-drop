import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check } from "lucide-react";
import PrismaSchemaEditor from "./PrismaSchemaEditor";

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
}

const CodeBlock = ({ children, language = "bash", className = "" }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 pr-12 font-mono text-sm text-gray-300 overflow-x-auto">
        {children}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-gray-700 text-gray-400 hover:text-gray-200"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
};

interface TabContentProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  schemaContent?: string;
  onSchemaChange?: (schema: string) => void;
  connectionString?: string;
}

const TabContent = ({
  activeTab = "schema",
  onTabChange = () => {},
  schemaContent: externalSchemaContent,
  onSchemaChange = () => {},
  connectionString = "",
}: TabContentProps) => {
  const schemaContent =
    externalSchemaContent ||
    `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`;

  const [connectionType, setConnectionType] = useState<"prisma" | "direct">("prisma");
  const [copied, setCopied] = useState(false);
  const [packageManager, setPackageManager] = useState<"npm" | "yarn" | "pnpm" | "bun">("npm");

  const handleTabChange = (value: string) => {
    onTabChange(value);
  };

  const handleCopyConnectionString = async () => {
    try {
      await navigator.clipboard.writeText(getConnectionString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy connection string:", error);
    }
  };

  const getCommand = (baseCommand: string) => {
    if (baseCommand.includes('npm run')) {
      return baseCommand.replace('npm run', `${packageManager} run`);
    }
    if (baseCommand.includes('npm install') || baseCommand.includes('npm i')) {
      const installMap = {
        npm: 'npm install',
        yarn: 'yarn add',
        pnpm: 'pnpm add', 
        bun: 'bun add'
      };
      return baseCommand.replace(/npm (install|i)/, installMap[packageManager]);
    }
    return baseCommand;
  };

  const getConnectionString = () => {
    if (connectionType === "prisma") {
      return connectionString;
    } else {
      // Direct connection string (same for now, but could be different)
      return connectionString;
    }
  };

  const getConnectionInstructions = () => {
    if (connectionType === "prisma") {
      return "Add this to your .env file as DATABASE_URL for use with Prisma ORM";
    } else {
      return "Use this connection string directly with your PostgreSQL client";
    }
  };

  return (
    <div className="w-full h-full bg-background">
      <Tabs
        defaultValue={activeTab}
        onValueChange={handleTabChange}
        className="w-full h-full"
      >
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-gray-800 p-1 text-gray-400 w-full">
          <TabsTrigger 
            value="database" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-gray-700 hover:text-gray-200 flex-1"
          >
            Database Connection
          </TabsTrigger>
          <TabsTrigger 
            value="schema" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-gray-700 hover:text-gray-200 flex-1"
          >
            Edit Your Schema
          </TabsTrigger>
          <TabsTrigger 
            value="studio" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-gray-700 hover:text-gray-200 flex-1"
          >
            View Your Data
          </TabsTrigger>
        </TabsList>

        {/* Database URL Tab */}
        <TabsContent value="database" className="w-full h-[calc(100%-40px)] mt-0">
          <Card className="w-full h-full border-0 rounded-none bg-gray-900 border-gray-800">
            <CardContent className="p-6 h-full overflow-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">Database Connection</h2>
                  <p className="text-gray-400">
                    Your temporary PostgreSQL database is ready to use. Copy the connection string below to connect your applications.
                  </p>
                </div>


                
                {/* Connection Type Tabs */}
                <div className="flex items-center justify-between">
                  <Tabs value={connectionType} onValueChange={(value) => setConnectionType(value as "prisma" | "direct")}>
                    <TabsList className="grid w-80 grid-cols-2 bg-gray-700 p-1">
                      <TabsTrigger value="prisma" className="text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white hover:bg-gray-600 hover:text-gray-200 transition-colors">With Prisma ORM</TabsTrigger>
                      <TabsTrigger value="direct" className="text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white hover:bg-gray-600 hover:text-gray-200 transition-colors">Direct Connection</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">Package Manager:</span>
                    <Select value={packageManager} onValueChange={(value) => setPackageManager(value as any)}>
                      <SelectTrigger className="w-24 h-8 bg-gray-700 border-gray-600 text-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="npm" className="text-gray-300 hover:bg-gray-700">npm</SelectItem>
                        <SelectItem value="yarn" className="text-gray-300 hover:bg-gray-700">yarn</SelectItem>
                        <SelectItem value="pnpm" className="text-gray-300 hover:bg-gray-700">pnpm</SelectItem>
                        <SelectItem value="bun" className="text-gray-300 hover:bg-gray-700">bun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Tabs value={connectionType} onValueChange={(value) => setConnectionType(value as "prisma" | "direct")}>
                  
                  <TabsContent value="prisma" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">DATABASE_URL</label>
                      <div className="relative">
                        <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 pr-12 font-mono text-sm text-gray-300 overflow-x-auto">
                          {getConnectionString()}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyConnectionString}
                          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                        >
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-400">
                        {getConnectionInstructions()}
                      </p>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-3">Quick Start with Prisma ORM</h3>
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-gray-300 mb-2">1. Download the example project and install dependencies:</p>
                          <CodeBlock>{getCommand(`npx try-prisma@latest --template databases/prisma-postgres --name hello-prisma --install ${packageManager}`)}</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">2. Navigate to your project directory:</p>
                          <CodeBlock>cd hello-prisma</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">3. Set up your environment file:</p>
                          <CodeBlock>mv .env.example .env</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">4. Add the connection string to your <code className="bg-gray-700 px-1 py-0.5 rounded text-gray-200">.env</code> file:</p>
                          <CodeBlock>DATABASE_URL="{getConnectionString()}"</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">5. Create database tables with a migration:</p>
                          <CodeBlock>npx prisma migrate dev --name init</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">6. Run example queries:</p>
                          <CodeBlock>{getCommand(`${packageManager} run queries`)}</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">7. (Optional) Explore your data with Prisma Studio:</p>
                          <CodeBlock>npx prisma studio</CodeBlock>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-3">For Existing Projects</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-300 mb-2">1. Initialize Prisma in your existing project:</p>
                          <CodeBlock>npx prisma init</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">2. Add the connection string to your <code className="bg-gray-700 px-1 py-0.5 rounded text-gray-200">.env</code> file:</p>
                          <CodeBlock>DATABASE_URL="{getConnectionString()}"</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">3. Define your data model in <code className="bg-gray-700 px-1 py-0.5 rounded text-gray-200">schema.prisma</code>, then apply it:</p>
                          <CodeBlock>npx prisma db push</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">4. Generate the Prisma Client:</p>
                          <CodeBlock>npx prisma generate</CodeBlock>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-700">
                        <a 
                          href="https://www.prisma.io/docs/getting-started/quickstart-prismaPostgres" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition-colors"
                        >
                          Follow the complete quickstart guide
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="direct" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Direct Connection String</label>
                      <div className="relative">
                        <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 pr-12 font-mono text-sm text-gray-300 overflow-x-auto">
                          {getConnectionString()}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyConnectionString}
                          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                        >
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-400">
                        Use this connection string with any PostgreSQL client, ORM, or database tool. SSL mode is required.
                      </p>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-3">Connection Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Host</p>
                          <p className="text-gray-300 font-mono">db.prisma-drop.com</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Port</p>
                          <p className="text-gray-300 font-mono">5432</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Database</p>
                          <p className="text-gray-300 font-mono">{connectionString.split('/').pop()?.split('?')[0] || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">SSL Mode</p>
                          <p className="text-gray-300 font-mono">Required</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-3">Using with Database Clients</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-300 mb-2">Connect with <strong>psql</strong>:</p>
                          <CodeBlock>psql "{getConnectionString()}"</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">For GUI clients (TablePlus, DataGrip, etc.):</p>
                          <div className="bg-gray-900 border border-gray-600 rounded p-2 space-y-1">
                            <div className="text-gray-300">Host: <span className="text-gray-200">db.prisma-drop.com</span></div>
                            <div className="text-gray-300">Port: <span className="text-gray-200">5432</span></div>
                            <div className="text-gray-300">Database: <span className="text-gray-200">{connectionString.split('/').pop()?.split('?')[0] || 'N/A'}</span></div>
                            <div className="text-gray-300">Username: <span className="text-gray-200">prisma</span></div>
                            <div className="text-gray-300">Password: <span className="text-gray-200">[from connection string]</span></div>
                            <div className="text-gray-300">SSL Mode: <span className="text-gray-200">Require</span></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-3">Local Development with TCP Tunnel</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-300 mb-2">For secure local development, use the Prisma TCP tunnel:</p>
                          <CodeBlock>npx @prisma/ppg-tunnel</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">Set your connection string as an environment variable:</p>
                          <CodeBlock>export DATABASE_URL="{getConnectionString()}"</CodeBlock>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">The tunnel will provide a local endpoint like:</p>
                          <CodeBlock>127.0.0.1:52604 (random port)</CodeBlock>
                        </div>
                        <div className="bg-amber-950/30 border border-amber-500/50 rounded p-3">
                          <p className="text-amber-200 text-xs">
                            <strong>Note:</strong> TCP tunnel is for development only. Authentication is handled automatically - no username/password needed.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-3">Connection Limits & Considerations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 mb-2">Connection Limits:</p>
                          <ul className="text-gray-300 space-y-1">
                            <li>• Maximum 10 concurrent connections</li>
                            <li>• Connections auto-managed by client</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-2">Timeouts:</p>
                          <ul className="text-gray-300 space-y-1">
                            <li>• Query timeout: 10 seconds</li>
                            <li>• Transaction timeout: 15 seconds</li>
                            <li>• Idle connections may be closed</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-700">
                        <a 
                          href="https://www.prisma.io/docs/postgres/database/direct-connections" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition-colors"
                        >
                          Read more in our documentation
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="bg-amber-950/30 border border-amber-500/50 rounded-lg p-4">
                  <h3 className="text-amber-400 font-medium mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Important Notice
                  </h3>
                  <p className="text-amber-200 text-sm">
                    This database will be automatically deleted after 24 hours unless claimed. 
                    Make sure to backup any important data or claim the database to make it permanent.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schema Editor Tab */}
        <TabsContent value="schema" className="w-full h-[calc(100%-40px)] mt-0">
          <Card className="w-full h-full border-0 rounded-none">
            <PrismaSchemaEditor 
              value={schemaContent}
              onChange={onSchemaChange}
            />
          </Card>
        </TabsContent>

        {/* Prisma Studio Tab */}
        <TabsContent value="studio" className="w-full h-[calc(100%-40px)] mt-0">
          <Card className="w-full h-full border-0 rounded-none">
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-muted/20">
              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold mb-2">Prisma Studio</h3>
                <p className="text-muted-foreground mb-4">
                  This would be an embedded version of Prisma Studio for
                  browsing and editing database records.
                </p>
                <div className="border rounded-md p-4 bg-background">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-2">
                      <div className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium">
                        User
                      </div>
                      <div className="bg-muted px-3 py-1 rounded-md text-sm">
                        Post
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      New Record
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="p-2 text-left">id</th>
                          <th className="p-2 text-left">email</th>
                          <th className="p-2 text-left">name</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-2">1</td>
                          <td className="p-2">user1@example.com</td>
                          <td className="p-2">User One</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2">2</td>
                          <td className="p-2">user2@example.com</td>
                          <td className="p-2">User Two</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabContent;
