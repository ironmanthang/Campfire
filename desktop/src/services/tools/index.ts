// Public interface for the AI tools layer.
// Consumers import from `services/tools` for both schema definitions and
// the runtime executor — the previous split into `chatTools.ts` and
// `toolExecutor.ts` is preserved inside as `./definitions` and `./executor`.

export { LOCAL_TOOLS, getWebSearchTool, getWebFetchTool } from "./definitions";
export { executeToolCall, findToolCallInput } from "./executor";
export type { ToolExecutionContext } from "./executor";
