import { invoke } from "@tauri-apps/api/core";
import { AppConfig, SystemResources } from "../../types";
import { OllamaMessage, OllamaToolCall } from "../ollama";
import { formatSystemResources } from "../../lib/systemResources";
import { OLLAMA_BASE_URL, isTauri } from "../../lib/constants";



export interface ToolExecutionContext {
  config: AppConfig;
  chatStartDate: string;
  chatEndDate: string;
  activeModel: string;
  onNavigateToDate?: (date: string) => void;
}

export function findToolCallInput(messages: OllamaMessage[], toolMsgIndex: number): OllamaToolCall | null {
  let assistantMsg: OllamaMessage | null = null;
  let assistantIndex = -1;
  for (let i = toolMsgIndex - 1; i >= 0; i--) {
    if (messages[i].role === "assistant" && messages[i].tool_calls) {
      assistantMsg = messages[i];
      assistantIndex = i;
      break;
    }
  }
  if (!assistantMsg || !assistantMsg.tool_calls) return null;

  let toolCount = 0;
  for (let i = assistantIndex + 1; i < toolMsgIndex; i++) {
    if (messages[i].role === "tool") {
      toolCount++;
    }
  }

  if (toolCount < assistantMsg.tool_calls.length) {
    return assistantMsg.tool_calls[toolCount];
  }
  return null;
}

export async function executeToolCall(
  toolCall: OllamaToolCall,
  context: ToolExecutionContext
): Promise<OllamaMessage> {
  const { name } = toolCall.function;
  const args = toolCall.function.arguments;

  switch (name) {
    case "web_search": {
      const query = args.query;
      try {
        const res = await invoke<any[]>("search_web", {
          provider: context.config.web_search_provider,
          query: query,
          apiKey: context.config.web_search_api_key,
          googleCx: context.config.web_search_google_cx,
        });

        let formattedResults = `### Web Search Results for: "${query}"\n`;
        if (res.length === 0) {
          formattedResults += "No results returned from search engine.\n";
        } else {
          res.forEach((r: any, idx: number) => {
            formattedResults += `${idx + 1}. **[${r.title}](${r.url})**\n   ${r.snippet}\n\n`;
          });
        }

        return {
          role: "tool",
          content: formattedResults,
          name: "web_search"
        };
      } catch (err: any) {
        console.error("Failed to run web_search tool:", err);
        return {
          role: "tool",
          content: `Error running web search: ${err.message || err}`,
          name: "web_search"
        };
      }
    }

    case "web_fetch": {
      const targetUrl = args.url;
      try {
        const content = await invoke<string>("fetch_web_page", { url: targetUrl });
        return {
          role: "tool",
          content: `### Page Content for: ${targetUrl}\n\n${content}`,
          name: "web_fetch"
        };
      } catch (err: any) {
        console.error("Failed to run web_fetch tool:", err);
        return {
          role: "tool",
          content: `Error fetching URL content for ${targetUrl}: ${err.message || err}`,
          name: "web_fetch"
        };
      }
    }

    case "get_system_resources": {
      try {
        const res = await invoke<SystemResources>("get_system_resources");
        const formattedStats = formatSystemResources(res);
        return {
          role: "tool",
          content: formattedStats,
          name: "get_system_resources"
        };
      } catch (err: any) {
        console.error("Failed to run get_system_resources tool:", err);
        return {
          role: "tool",
          content: "Error: Could not retrieve system hardware stats.",
          name: "get_system_resources"
        };
      }
    }

    case "read_journal_entries": {
      const startDateArg = args.start_date;
      const endDateArg = args.end_date;
      if (startDateArg < context.chatStartDate || endDateArg > context.chatEndDate) {
        const limitMsg = `Error: You are only allowed to query date ranges within your clone memory range: from ${context.chatStartDate} to ${context.chatEndDate}. Querying range (${startDateArg} to ${endDateArg}) is outside this boundary and is forbidden.`;
        return {
          role: "tool",
          content: limitMsg,
          name: "read_journal_entries"
        };
      }

      try {
        const res = await invoke<string>("get_journal_context", {
          dirPath: context.config.journal_dir,
          startDate: startDateArg,
          endDate: endDateArg
        });

        let resultText = res;
        if (!res || res.trim() === "") {
          resultText = `No journal entries found between ${startDateArg} and ${endDateArg}.`;
        }

        return {
          role: "tool",
          content: resultText,
          name: "read_journal_entries"
        };
      } catch (err: any) {
        console.error("Failed to run read_journal_entries tool:", err);
        return {
          role: "tool",
          content: `Error reading journal entries: ${err.message || err}`,
          name: "read_journal_entries"
        };
      }
    }

    case "navigate_to_journal_date": {
      const targetDate = args.date;
      if (targetDate < context.chatStartDate || targetDate > context.chatEndDate) {
        const limitMsg = `Error: You are only allowed to navigate to dates within your clone memory range: from ${context.chatStartDate} to ${context.chatEndDate}. The date ${targetDate} is outside this range.`;
        return {
          role: "tool",
          content: limitMsg,
          name: "navigate_to_journal_date"
        };
      }

      if (context.onNavigateToDate) {
        try {
          context.onNavigateToDate(targetDate);
          return {
            role: "tool",
            content: `Successfully navigated the application screen to the journal entry editor for ${targetDate}.`,
            name: "navigate_to_journal_date"
          };
        } catch (err: any) {
          console.error("Failed to execute navigate_to_journal_date tool:", err);
          return {
            role: "tool",
            content: `Error: Failed to navigate to date ${targetDate}. Details: ${err.message || err}`,
            name: "navigate_to_journal_date"
          };
        }
      } else {
        return {
          role: "tool",
          content: "Error: Navigation service is not available in the current context.",
          name: "navigate_to_journal_date"
        };
      }
    }

    case "scan_for_garbage": {
      const startDateArg = args.start_date;
      const endDateArg = args.end_date;
      const userInstruction = args.user_instruction;

      if (startDateArg < context.chatStartDate || endDateArg > context.chatEndDate) {
        const limitMsg = `Error: You are only allowed to query date ranges within your clone memory range: from ${context.chatStartDate} to ${context.chatEndDate}. Querying range (${startDateArg} to ${endDateArg}) is outside this boundary and is forbidden.`;
        return {
          role: "tool",
          content: limitMsg,
          name: "scan_for_garbage"
        };
      }

      try {
        const res = await invoke<string>("get_journal_context_with_lines", {
          dirPath: context.config.journal_dir,
          startDate: startDateArg,
          endDate: endDateArg
        });

        if (!res || res.trim() === "") {
          return {
            role: "tool",
            content: `No journal entries found between ${startDateArg} and ${endDateArg} to scan.`,
            name: "scan_for_garbage"
          };
        }

        const userName = context.config.user_name?.trim() || "the user";
        let systemPrompt = `You are a careful editor reviewing ${userName}'s private
journal. Your job is to find lines that are clearly *unintentional* noise — text that was almost certainly not meant to be there — so the user can decide whether to delete them.

Garbage includes:
- Keyboard mashes (e.g. "asdfasdf", "qweqwe").
- Unused template text or placeholders.
- Accidentally repeated/duplicated lines or blocks.
- Debris like terminal dumps, error logs, or unrelated config blocks.
- Stray symbols or single-character lines.

And especially **grammar errors**.

Analyze the entries and list any garbage lines. If you find any garbage, output a concise markdown list of findings. For each item, include:
- Date: YYYY-MM-DD
- Line numbers (e.g. "lines 3-5" or "entire entry")
- Trash snippet
- Reason
- Suggested Fix: Proposed fix, correction, or "Delete line" if pure noise

If no garbage is found, reply with: "No potential garbage lines found."`;

        if (userInstruction && userInstruction.trim() !== "") {
          systemPrompt += `\n\n### CRITICAL ADDITIONAL INSTRUCTION:\n${userInstruction.trim()}\nPlease pay close attention to this directive when identifying garbage or candidate sections for removal.`;
        }

        const savedSubModel = localStorage.getItem("chat_tool_garbage_model") || "default";
        const analysisModel = savedSubModel === "default" ? context.activeModel : savedSubModel;

        let data: any;
        const payload = {
          model: analysisModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: res }
          ],
          stream: false,
          timeout_secs: 600
        };

        if (isTauri()) {
          data = await invoke<any>("proxy_ollama_chat", {
            baseUrl: OLLAMA_BASE_URL,
            payload,
          });
        } else {
          const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || "Ollama background query failed");
          }

          data = await response.json();
        }

        const markdownReport = data.message?.content || "Error: No response generated by background model.";

        return {
          role: "tool",
          content: markdownReport.trim(),
          name: "scan_for_garbage"
        };
      } catch (err: any) {
        console.error("Failed to run scan_for_garbage tool:", err);
        return {
          role: "tool",
          content: `Error scanning journal for garbage: ${err.message || err}`,
          name: "scan_for_garbage"
        };
      }
    }

    default: {
      return {
        role: "tool",
        content: `Error: Tool "${name}" is not implemented.`,
        name: name
      };
    }
  }
}
