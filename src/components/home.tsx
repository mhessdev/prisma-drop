import React, { useState, useEffect } from "react";
import { Github, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/toaster";
import TabContent from "./TabContent";

const Home = () => {
  const [connectionString, setConnectionString] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("database");
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

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleClaimDatabase = () => {
    // Simulate claiming the database
    alert("Database claimed successfully! It will no longer expire.");
    setTimeRemaining(null); // Remove expiration
  };

  return (
    <div className="h-screen bg-gray-1000 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900 p-4 flex-shrink-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg width="24" height="30" viewBox="0 0 58 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z" fill="white"/>
            </svg>
            <h1 className="text-xl font-bold text-white">npx create-db</h1>
          </div>

          <div className="flex items-center justify-center flex-1">
            {!loading && (
              <Badge variant="outline" className="text-lg px-4 py-2 border-amber-500 text-amber-400 bg-amber-950/30 font-semibold">
                {timeRemaining
                  ? `${Math.floor(timeRemaining)}h ${Math.floor((timeRemaining % 1) * 60)}m remaining`
                  : "Permanent"}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={handleLogin}>
                <User className="h-4 w-4 mr-2" />
                Login
              </Button>
            ) : timeRemaining ? (
              <Button variant="default" size="sm" onClick={handleClaimDatabase} className="bg-indigo-600 hover:bg-indigo-700">
                <svg width="14" height="18" viewBox="0 0 58 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path fillRule="evenodd" clipRule="evenodd" d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z" fill="currentColor"/>
                </svg>
                Claim Database
              </Button>
            ) : (
              <Badge variant="secondary">Database Claimed</Badge>
            )}

            <ThemeToggle />
            
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

      <main className="container mx-auto py-4 px-4 flex-1 flex flex-col min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <div className="animate-pulse">
              <svg width="48" height="60" viewBox="0 0 58 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z" fill="white"/>
              </svg>
            </div>
            <p className="mt-4 text-lg text-gray-300">
              Provisioning your temporary database...
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <TabContent
              activeTab={activeTab}
              onTabChange={setActiveTab}
              schemaContent={schemaContent}
              onSchemaChange={setSchemaContent}
              connectionString={connectionString}
            />
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
};

export default Home;
