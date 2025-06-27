import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Github, User, Database, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SplitView from "./SplitView";
import AIChatPanel from "./AIChatPanel";
import TabContent from "./TabContent";

const Home = () => {
  const [connectionString, setConnectionString] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schema");
  const [databaseId, setDatabaseId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(24); // hours
  const [schemaContent, setSchemaContent] = useState<string>(
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
}`,
  );

  // Simulate database provisioning on component mount
  useEffect(() => {
    const provisionDatabase = async () => {
      setLoading(true);
      try {
        // Simulate API call to provision database
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockDbId = `db_${Math.random().toString(36).substring(2, 10)}`;
        const mockConnectionString = `postgresql://prisma:password@db.prisma-drop.com:5432/${mockDbId}?schema=public`;

        setConnectionString(mockConnectionString);
        setDatabaseId(mockDbId);
        setLoading(false);
      } catch (error) {
        console.error("Failed to provision database:", error);
        setLoading(false);
      }
    };

    provisionDatabase();
  }, []);

  // Simulate countdown timer for database expiration
  useEffect(() => {
    if (!loading && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1 / 60); // Decrease by 1 minute
      }, 60000); // Update every minute

      return () => clearInterval(timer);
    }
  }, [loading, timeRemaining]);

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleClaimDatabase = () => {
    // Simulate claiming the database
    alert("Database claimed successfully! It will no longer expire.");
    setTimeRemaining(null); // Remove expiration
  };

  const handleShareSchema = () => {
    // Simulate generating a shareable URL
    const shareUrl = `https://prisma-drop.com/${databaseId}/schema`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Schema URL copied to clipboard: ${shareUrl}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Prisma Drop</h1>
            {!loading && (
              <Badge variant="outline" className="ml-2">
                {timeRemaining
                  ? `${Math.floor(timeRemaining)}h ${Math.floor((timeRemaining % 1) * 60)}m remaining`
                  : "Permanent"}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!loading && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareSchema}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Schema
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Generate a shareable URL for your schema
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {!isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={handleLogin}>
                <User className="h-4 w-4 mr-2" />
                Login
              </Button>
            ) : timeRemaining ? (
              <Button variant="default" size="sm" onClick={handleClaimDatabase}>
                <Database className="h-4 w-4 mr-2" />
                Claim Database
              </Button>
            ) : (
              <Badge variant="secondary">Database Claimed</Badge>
            )}

            <a
              href="https://github.com/prisma/prisma-drop"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon">
                <Github className="h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-4 px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Database className="h-12 w-12 text-primary" />
            </motion.div>
            <p className="mt-4 text-lg">
              Provisioning your temporary database...
            </p>
          </div>
        ) : (
          <>
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Database Connection</h2>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Temporary</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClaimDatabase}
                      >
                        Claim DB
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted p-2 rounded-md font-mono text-sm overflow-x-auto">
                    {connectionString}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This database will be automatically deleted after 24 hours
                    unless claimed.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="h-[calc(100vh-250px)]">
              <SplitView
                leftPanel={<AIChatPanel onSchemaChange={setSchemaContent} />}
                rightPanel={
                  <TabContent
                    activeTab={activeTab}
                    schemaContent={schemaContent}
                    onSchemaChange={setSchemaContent}
                  />
                }
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Home;
