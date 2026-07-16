import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { DraftAttachment } from "../types";

interface UseFileAttachmentsOptions {
  showNotification: (text: string, type: "success" | "error") => void;
}

export function useFileAttachments({
  showNotification,
}: UseFileAttachmentsOptions) {
  const { t } = useTranslation();
  const [draftAttachments, setDraftAttachments] = useState<DraftAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      draftAttachments.forEach((att) => {
        if (att.previewUrl) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });
    };
  }, [draftAttachments]);

  const processFiles = (files: File[]) => {
    const maxTextSizeKB = 500;

    files.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const extension = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();

      const isTextExtension = [
        "g4", "md", "tsx", "ts", "js", "jsx", "json", "txt", "py", "rs",
        "css", "html", "yaml", "yml", "toml", "sh", "bat", "ini", "cfg", "xml"
      ].includes(extension) || file.type.startsWith("text/");

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            const base64Content = result.split(",")[1] || "";
            const previewUrl = URL.createObjectURL(file);
            setDraftAttachments((prev) => [
              ...prev,
              {
                id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
                name: file.name,
                size: file.size,
                type: "image",
                content: base64Content,
                previewUrl
              }
            ]);
          }
        };
        reader.onerror = () => {
          showNotification(t("chatView.errorReadingFile", { name: file.name }), "error");
        };
        reader.readAsDataURL(file);
      } else if (isTextExtension) {
        if (file.size > maxTextSizeKB * 1024) {
          showNotification(
            t("chatView.errorFileTooLarge", { size: Math.round(file.size / 1024), max: maxTextSizeKB }),
            "error"
          );
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setDraftAttachments((prev) => [
            ...prev,
            {
              id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
              name: file.name,
              size: file.size,
              type: "text",
              content
            }
          ]);
        };
        reader.onerror = () => {
          showNotification(t("chatView.errorReadingFile", { name: file.name }), "error");
        };
        reader.readAsText(file);
      } else {
        showNotification(t("chatView.errorBinaryNotSupported", { name: file.name }), "error");
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setDraftAttachments((prev) => {
      const match = prev.find((att) => att.id === id);
      if (match && match.previewUrl) {
        URL.revokeObjectURL(match.previewUrl);
      }
      return prev.filter((att) => att.id !== id);
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const filesToProcess: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          filesToProcess.push(file);
        }
      }
    }

    if (filesToProcess.length > 0) {
      e.preventDefault();
      processFiles(filesToProcess);
    }
  };

  const clearAttachments = () => {
    setDraftAttachments([]);
  };

  return {
    draftAttachments,
    setDraftAttachments,
    isDragging,
    fileInputRef,
    processFiles,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveAttachment,
    handlePaste,
    clearAttachments
  };
}
