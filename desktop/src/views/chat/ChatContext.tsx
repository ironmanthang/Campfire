import { createContext, useContext } from "react";
import { OllamaMessage } from "../../services/ollama";
import { DraftAttachment } from "../../types";

export interface ChatContextType {
  chatStartDate: string;
  setChatStartDate: (date: string) => void;
  chatEndDate: string;
  setChatEndDate: (date: string) => void;
  chatMessages: OllamaMessage[];
  isStreamingChat: boolean;
  tokenInfo: {
    count: number;
    limit: number;
    status: "safe" | "warning" | "blocked";
  };
  activeToolName: string | null;
  enabledTools: string[];
  setEnabledTools: (tools: string[]) => void;
  loadingChatContext: boolean;
  chatContextText: string;
  handleResetChat: () => Promise<void>;
  handleStopChat: () => void;
  handleSendChatMessage: (text: string, draftAttachments: DraftAttachment[], clearAttachments: () => void) => Promise<void>;
  checkTokenCapacity: (context: string) => Promise<boolean>;

  // Attachments
  draftAttachments: DraftAttachment[];
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  handleRemoveAttachment: (id: string) => void;
  clearAttachments: () => void;

  // General layout/inputs
  chatWidth: number;
  startDrag: (e: React.MouseEvent) => void;
  showHelpModal: boolean;
  setShowHelpModal: (show: boolean) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
  showThinking: boolean;
  setShowThinking: (val: boolean) => void;
  collapseToolResponse: boolean;
  setCollapseToolResponse: (val: boolean) => void;
  showSuggestedPrompt: boolean;
  setShowSuggestedPrompt: (val: boolean) => void;
  showChatSettings: boolean;
  setShowChatSettings: (show: boolean) => void;
  handleInitiateEditMessage: (index: number) => void;
  chatSubmissionMode: "queue" | "interrupt";
  setChatSubmissionMode: (mode: "queue" | "interrupt") => void;
  messageQueue: { text: string; attachments: DraftAttachment[] }[];
  cancelQueuedMessage: (index: number) => void;
  chatResetCounter: number;
}

export const ChatContext = createContext<ChatContextType | null>(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
