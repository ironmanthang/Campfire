import { OllamaTool } from "../ollama";

export const LOCAL_TOOLS: OllamaTool[] = [
  {
    type: "function",
    function: {
      name: "get_system_resources",
      description: "Query and retrieve the host computer's live hardware statistics, including current CPU usage percentage, free/total system memory (RAM), and any running Ollama local AI models in memory. Use this whenever the user asks about the computer status, performance, resource consumption, or running AI models.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_journal_entries",
      description: "Retrieve raw journal entries by the user within a specific date range. Use this tool whenever you need to recall, double-check, verify, or Reexamine the journal logs to avoid hallucinating details. If you only need to read a single specific date, set both start_date and end_date to that same date. IMPORTANT: You are only allowed to query date ranges within your memory range.",
      parameters: {
        type: "object",
        properties: {
          start_date: {
            type: "string",
            description: "The start date of the range to retrieve (inclusive, format: YYYY-MM-DD)."
          },
          end_date: {
            type: "string",
            description: "The end date of the range to retrieve (inclusive, format: YYYY-MM-DD)."
          }
        },
        required: ["start_date", "end_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "navigate_to_journal_date",
      description: "Navigate the user interface directly to the journal entry editor for a specific date. Use this whenever the user explicitly asks you to 'bring me to that date', 'open that date', 'navigate to that date' or similar UI navigation requests. Do NOT use this tool if the user is asking you to read, summarize, or retrieve the text content of an entry.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "The target date to open in the journal editor (format: YYYY-MM-DD)."
          }
        },
        required: ["date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "scan_for_garbage",
      description: "Scan the user's journal entries within a specific date range to detect potential garbage, keyboard mashes, unused templates, duplicate lines, debris and especially grammar errors. This tool will analyze the content and return a markdown report detailing the dates, line numbers, snippets, and reasons for any detected garbage. Do NOT use this tool if the user is asking you to read, summarize, or retrieve normal text content. IMPORTANT: You are only allowed to query date ranges within your clone memory range. After calling the tool, ask the user if they want to be navigate to of those date for them to delete it themself",
      parameters: {
        type: "object",
        properties: {
          start_date: {
            type: "string",
            description: "The start date of the range to scan (format: YYYY-MM-DD)."
          },
          end_date: {
            type: "string",
            description: "The end date of the range to scan (format: YYYY-MM-DD)."
          },
          user_instruction: {
            type: "string",
            description: "Optional custom instruction, focus topic, or cleanup criteria for the garbage analysis AI. If the user specifies any topic, intent, plan, or custom constraint to target or clean up (e.g., 'focus on my plan to America' or 'find grammar errors related to run-on sentences'), pass that custom prompt/instruction into this parameter."
          }
        },
        required: ["start_date", "end_date"]
      }
    }
  }
];

export function getWebSearchTool(): OllamaTool {
  return {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for real-time information, news, or topics. Returns search engine index results with page titles, URLs, and short summary snippets. Note: Search snippets are brief summaries, NOT full page content.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to run on the search engine."
          }
        },
        required: ["query"]
      }
    }
  };
}

export function getReadWebPageTool(): OllamaTool {
  return {
    type: "function",
    function: {
      name: "read_web_page",
      description: "Fetch and read the raw text or Markdown content of a specific HTTP/HTTPS URL. Use this tool whenever you have a target web URL (whether provided directly by the user or discovered during research) and need or want to read its full, detailed page content.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The full target URL to fetch (must start with http:// or https://)."
          }
        },
        required: ["url"]
      }
    }
  };
}

