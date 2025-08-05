import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PrismaSchemaEditor from "./PrismaSchemaEditor";

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

  const handleTabChange = (value: string) => {
    onTabChange(value);
  };

  return (
    <div className="w-full h-full bg-background">
      <Tabs
        defaultValue={activeTab}
        onValueChange={handleTabChange}
        className="w-full h-full"
      >
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="schema">Schema Editor</TabsTrigger>
          <TabsTrigger value="studio">Prisma Studio</TabsTrigger>
        </TabsList>

        {/* Schema Editor Tab */}
        <TabsContent value="schema" className="w-full h-[calc(100%-40px)]">
          <Card className="w-full h-full border-0 rounded-none">
            <PrismaSchemaEditor 
              value={schemaContent}
              onChange={onSchemaChange}
            />
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
      </Tabs>
    </div>
  );
};

export default TabContent;
