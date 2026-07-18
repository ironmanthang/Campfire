import { OllamaMessage } from "./types";
import { DraftAttachment } from "../../types";

export function parseMessageContent(msg: OllamaMessage): { cleanPrompt: string; draftAttachments: DraftAttachment[] } {
  const draftAttachments: DraftAttachment[] = [];

  // 1. Recreate image attachments from msg.images
  if (msg.images && msg.images.length > 0) {
    msg.images.forEach((imgBase64, index) => {
      const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
      const size = Math.round((imgBase64.length * 3) / 4);
      draftAttachments.push({
        id,
        name: `Attached Image ${index + 1}.png`,
        size,
        type: "image",
        content: imgBase64,
        previewUrl: `data:image/png;base64,${imgBase64}`
      });
    });
  }

  // 2. Parse text attachments from msg.content
  const textRegex = /\n\n\[Attached File:\s*([^\]]+)\]\n```\n([\s\S]*?)\n```/g;
  let match;
  while ((match = textRegex.exec(msg.content)) !== null) {
    const name = match[1];
    const content = match[2];
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    draftAttachments.push({
      id,
      name,
      size: content.length,
      type: "text",
      content
    });
  }

  // 3. Find the clean text prompt
  let cleanPrompt = "";
  if (msg.rawInput) {
    cleanPrompt = msg.rawInput;
  } else if (msg.displayContent) {
    const idx = msg.displayContent.indexOf("\n\n📎 *");
    cleanPrompt = idx !== -1 ? msg.displayContent.slice(0, idx) : msg.displayContent;
  } else {
    const idx = msg.content.indexOf("\n\n[Attached File:");
    cleanPrompt = idx !== -1 ? msg.content.slice(0, idx) : msg.content;
  }

  return {
    cleanPrompt: cleanPrompt.trim(),
    draftAttachments
  };
}
