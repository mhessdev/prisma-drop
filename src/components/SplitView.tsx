import React, { useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import AIChatPanel from "./AIChatPanel";
import TabContent from "./TabContent";

interface SplitViewProps {
  defaultLayout?: number[];
  children?: React.ReactNode;
}

const SplitView = ({ defaultLayout = [30, 70], children }: SplitViewProps) => {
  const [activeTab, setActiveTab] = useState("schema"); // Default tab is schema editor

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="h-full w-full bg-background">
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[850px] rounded-lg border"
      >
        {/* Left panel - AI Chat */}
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          minSize={20}
          className="p-0"
        >
          <div className="h-full">
            <AIChatPanel />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel - Tab Content */}
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <div className="h-full">
            <TabContent activeTab={activeTab} onTabChange={handleTabChange} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SplitView;
