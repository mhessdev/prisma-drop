import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, RefreshCw } from "lucide-react";

interface TabContentProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  schemaContent?: string;
  onSchemaChange?: (schema: string) => void;
}

const TabContent = ({
  activeTab = "schema",
  onTabChange = () => {},
  schemaContent: externalSchemaContent,
  onSchemaChange = () => {},
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

  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM "User";');
  const [sqlResults, setSqlResults] = useState<any[]>([]);

  const [prismaCode, setPrismaCode] = useState<string>(
    `// Prisma client is already instantiated as 'prisma'

async function main() {
  // Get all users
  const users = await prisma.user.findMany({
    include: { posts: true }
  });
  
  return users;
}`,
  );
  const [prismaResults, setPrismaResults] = useState<string>("");

  const [queryLogs, setQueryLogs] = useState<
    Array<{ timestamp: string; query: string; duration: string }>
  >([
    {
      timestamp: new Date().toISOString(),
      query: 'SELECT * FROM "User" LIMIT 10',
      duration: "2.3ms",
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      query: 'INSERT INTO "User" ("email", "name") VALUES ($1, $2)',
      duration: "5.1ms",
    },
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      query: 'SELECT * FROM "Post" WHERE "authorId" = $1',
      duration: "1.8ms",
    },
  ]);

  const handleTabChange = (value: string) => {
    onTabChange(value);
  };

  const executeSqlQuery = () => {
    // Mock SQL execution
    setSqlResults([
      { id: 1, email: "user1@example.com", name: "User One" },
      { id: 2, email: "user2@example.com", name: "User Two" },
      { id: 3, email: "user3@example.com", name: "User Three" },
    ]);

    // Add to query logs
    setQueryLogs((prev) => [
      {
        timestamp: new Date().toISOString(),
        query: sqlQuery,
        duration: `${(Math.random() * 10).toFixed(1)}ms`,
      },
      ...prev,
    ]);
  };

  const executePrismaCode = () => {
    // Mock Prisma code execution
    setPrismaResults(
      JSON.stringify(
        [
          {
            id: 1,
            email: "user1@example.com",
            name: "User One",
            posts: [
              {
                id: 1,
                title: "First Post",
                content: "Content here...",
                published: true,
              },
            ],
          },
          {
            id: 2,
            email: "user2@example.com",
            name: "User Two",
            posts: [],
          },
        ],
        null,
        2,
      ),
    );

    // Add to query logs
    setQueryLogs((prev) => [
      {
        timestamp: new Date().toISOString(),
        query:
          'SELECT * FROM "User" LEFT JOIN "Post" ON "User"."id" = "Post"."authorId"',
        duration: `${(Math.random() * 10).toFixed(1)}ms`,
      },
      ...prev,
    ]);
  };

  return (
    <div className="w-full h-full bg-background">
      <Tabs
        defaultValue={activeTab}
        onValueChange={handleTabChange}
        className="w-full h-full"
      >
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="schema">Schema Editor</TabsTrigger>
          <TabsTrigger value="studio">Prisma Studio</TabsTrigger>
          <TabsTrigger value="logs">Query Logs</TabsTrigger>
          <TabsTrigger value="sql">SQL Playground</TabsTrigger>
          <TabsTrigger value="prisma">Prisma Playground</TabsTrigger>
        </TabsList>

        {/* Schema Editor Tab */}
        <TabsContent value="schema" className="w-full h-[calc(100%-40px)]">
          <Card className="w-full h-full border-0 rounded-none">
            <div className="w-full h-full p-0">
              <div className="flex items-center justify-between bg-muted p-2">
                <span className="text-sm font-medium">schema.prisma</span>
                <Button variant="ghost" size="sm">
                  <RefreshCw className="h-4 w-4 mr-1" /> Format
                </Button>
              </div>
              <div className="w-full h-[calc(100%-40px)] overflow-auto">
                <textarea
                  className="w-full h-full p-4 font-mono text-sm bg-background resize-none focus:outline-none"
                  value={schemaContent}
                  onChange={(e) => onSchemaChange(e.target.value)}
                  spellCheck="false"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Prisma Studio Tab */}
        <TabsContent value="studio" className="w-full h-[calc(100%-40px)]">
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

        {/* Query Logs Tab */}
        <TabsContent value="logs" className="w-full h-[calc(100%-40px)]">
          <Card className="w-full h-full border-0 rounded-none">
            <div className="w-full h-full p-4 overflow-auto">
              <h3 className="text-lg font-semibold mb-4">
                Database Query Logs
              </h3>
              <div className="space-y-2">
                {queryLogs.map((log, index) => (
                  <div
                    key={index}
                    className="border rounded-md p-3 bg-muted/10"
                  >
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span>{log.duration}</span>
                    </div>
                    <pre className="text-sm bg-muted/20 p-2 rounded overflow-x-auto">
                      {log.query}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* SQL Playground Tab */}
        <TabsContent value="sql" className="w-full h-[calc(100%-40px)]">
          <Card className="w-full h-full border-0 rounded-none">
            <div className="w-full h-full flex flex-col">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">SQL Playground</h3>
                <div className="border rounded-md">
                  <Textarea
                    className="font-mono resize-none min-h-[120px] border-0 rounded-t-md focus-visible:ring-0"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter SQL query..."
                  />
                  <div className="flex justify-end bg-muted/20 p-2 rounded-b-md">
                    <Button onClick={executeSqlQuery}>
                      <Play className="h-4 w-4 mr-1" /> Run Query
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex-1 p-4 overflow-auto">
                <h4 className="text-sm font-medium mb-2">Results</h4>
                {sqlResults.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          {Object.keys(sqlResults[0]).map((key) => (
                            <th key={key} className="p-2 text-left">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sqlResults.map((row, i) => (
                          <tr key={i} className="border-t">
                            {Object.values(row).map((value: any, j) => (
                              <td key={j} className="p-2">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    Run a query to see results
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Prisma Playground Tab */}
        <TabsContent value="prisma" className="w-full h-[calc(100%-40px)]">
          <Card className="w-full h-full border-0 rounded-none">
            <div className="w-full h-full flex flex-col">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">
                  Prisma Client Playground
                </h3>
                <div className="border rounded-md">
                  <Textarea
                    className="font-mono resize-none min-h-[150px] border-0 rounded-t-md focus-visible:ring-0"
                    value={prismaCode}
                    onChange={(e) => setPrismaCode(e.target.value)}
                    placeholder="Enter Prisma client code..."
                  />
                  <div className="flex justify-end bg-muted/20 p-2 rounded-b-md">
                    <Button onClick={executePrismaCode}>
                      <Play className="h-4 w-4 mr-1" /> Execute
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex-1 p-4 overflow-auto">
                <h4 className="text-sm font-medium mb-2">Output</h4>
                {prismaResults ? (
                  <pre className="p-4 bg-muted/10 rounded-md overflow-auto text-sm font-mono">
                    {prismaResults}
                  </pre>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    Execute code to see results
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabContent;
