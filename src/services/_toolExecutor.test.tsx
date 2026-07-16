import { useState, useEffect, useRef } from "react";
import { Play, RefreshCw, AlertTriangle, CheckCircle, Maximize2, Minimize2 } from "lucide-react";
import { executeToolCall, ToolExecutionContext } from "./toolExecutor";
import { OllamaToolCall, OllamaMessage } from "./ollama";
import { AppConfig } from "../types";
import { LOCAL_TOOLS, getWebSearchTool } from "./chatTools";
import { useAppStore } from "../store/useAppStore";
import { useOllamaStore } from "../store/useOllamaStore";
import { getLocalYYYYMMDD } from "../lib/dateUtils";

const tools = [...LOCAL_TOOLS, getWebSearchTool()];

const getToolDefaultArgs = (toolName: string): string => {
  const selectedTool = tools.find((t) => t.function.name === toolName);
  if (!selectedTool) return "{}";

  const props = selectedTool.function.parameters?.properties || {};
  const res: Record<string, any> = {};
  for (const [key, val] of Object.entries(props)) {
    const p = val as any;
    if (key === "start_date" || key === "date") {
      res[key] = "2024-01-01";
    } else if (key === "end_date") {
      res[key] = "2024-12-31";
    } else if (p.type === "integer" || p.type === "number") {
      res[key] = 0;
    } else if (p.type === "string") {
      res[key] = "";
    } else {
      res[key] = null;
    }
  }
  return JSON.stringify(res, null, 2);
};

const getPersistedValue = (key: string, fallback: string): string => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

export function ToolExecutorTestPanel() {
  const { 
    config, 
    setCurrentDate, 
    navigateToView 
  } = useAppStore();
  const { activeModel: appActiveModel } = useOllamaStore();

  const [toolName, setToolName] = useState<string>(tools[0]?.function.name || "");
  const [argsJson, setArgsJson] = useState<string>("{}");
  
  const [configJson, setConfigJson] = useState<string>("");
  const [chatStartDate, setChatStartDate] = useState("2024-01-01");
  const [chatEndDate, setChatEndDate] = useState("2024-12-31");
  const [activeModel, setActiveModel] = useState("");
  
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<OllamaMessage | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Dragging and positioning state
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize and Sync with active app configuration and models
  const syncWithAppState = () => {
    setConfigJson(JSON.stringify(config, null, 2));
    setChatStartDate(getPersistedValue("chat_filter_start", "2010-01-01"));
    setChatEndDate(getPersistedValue("chat_filter_end", getLocalYYYYMMDD()));
    setActiveModel(appActiveModel);
  };

  useEffect(() => {
    syncWithAppState();
  }, [config, appActiveModel]);

  // Set default JSON structure when the tool changes
  useEffect(() => {
    if (toolName) {
      setArgsJson(getToolDefaultArgs(toolName));
      setResult(null);
      setRawError(null);
      setJsonError(null);
    }
  }, [toolName]);

  // Live syntax checking of the JSON arguments
  useEffect(() => {
    if (!argsJson.trim()) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(argsJson);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  }, [argsJson]);

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      // Bounded coordinates so user can't lose the panel
      const boundedX = Math.max(0, Math.min(window.innerWidth - 120, newX));
      const boundedY = Math.max(0, Math.min(window.innerHeight - 100, newY));
      setPosition({ x: boundedX, y: boundedY });
    };

    const handleGlobalPointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [isDragging, dragStart]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only drag with left click
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select') || (e.target as HTMLElement).closest('textarea') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const run = async () => {
    setRunning(true);
    setRawError(null);
    setResult(null);
    setJsonError(null);

    try {
      let parsedArgs: Record<string, any> = {};
      try {
        parsedArgs = JSON.parse(argsJson);
      } catch (e: any) {
        setJsonError(`Invalid JSON arguments: ${e.message}`);
        setRunning(false);
        return;
      }

      let parsedConfig: AppConfig;
      if (configJson.trim()) {
        parsedConfig = JSON.parse(configJson);
      } else {
        parsedConfig = config;
      }

      const ctx: ToolExecutionContext = {
        config: parsedConfig,
        chatStartDate,
        chatEndDate,
        activeModel,
        onNavigateToDate: (date) => {
          console.log("[ToolExecutorTestPanel] Navigate to date:", date);
          setCurrentDate(date);
          navigateToView("journal");
        },
      };

      const toolCall: OllamaToolCall = {
        function: { name: toolName, arguments: parsedArgs },
      };

      const out = await executeToolCall(toolCall, ctx);
      setResult(out);
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("[ToolExecutorTestPanel] Error executing tool:", err);
      setRawError(msg);
    } finally {
      setRunning(false);
    }
  };

  const panelStyle: React.CSSProperties = position 
    ? { left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto', right: 'auto', position: 'fixed' } 
    : { bottom: '16px', right: '16px', position: 'fixed' };

  return (
    <div
      ref={panelRef}
      style={{
        ...panelStyle,
        resize: 'both',
        overflow: 'auto',
        minWidth: isExpanded ? '640px' : '360px',
        minHeight: '300px'
      }}
      className={`bg-bg-surface/90 backdrop-blur-md border border-border-brand/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-xs font-medium text-text-primary z-[99999] transition-[width,height] duration-200 ease-in-out ${
        isExpanded ? "w-[840px] h-[75vh]" : "w-[480px] max-h-[85vh]"
      }`}
    >
      {/* Header (Draggable Zone) */}
      <div 
        onPointerDown={handlePointerDown}
        className="flex items-center justify-between border-b border-border-brand/20 pb-3 cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧪</span>
          <div>
            <h3 className="font-bold text-sm tracking-wide">Tool Executor Test Panel</h3>
            <p className="text-[10px] text-text-secondary">Simulate exact AI tool payloads and execution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={syncWithAppState}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] bg-bg-app border border-border-brand/30 hover:border-accent-brand hover:text-accent-brand transition-all cursor-pointer"
            title="Pull live variables from the app settings & chat context"
          >
            <RefreshCw className="h-3 w-3" />
            Sync App State
          </button>
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="flex items-center p-1.5 rounded-lg bg-bg-app border border-border-brand/30 hover:border-accent-brand hover:text-accent-brand transition-all cursor-pointer"
            title={isExpanded ? "Collapse View" : "Expand View"}
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Form Fields / Grid */}
      <div className={`flex-1 overflow-y-auto ${isExpanded ? "grid grid-cols-2 gap-5" : "flex flex-col gap-4"}`}>
        
        {/* Left Hand Column (or full view when collapsed) */}
        <div className="flex flex-col gap-4">
          {/* Tool Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Select Tool</label>
            <select
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              className="w-full bg-bg-app border border-border-brand/40 hover:border-border-brand/80 rounded-xl px-3 py-2 text-text-primary transition-all outline-none focus:border-accent-brand"
            >
              {tools.map((t) => (
                <option key={t.function.name} value={t.function.name}>
                  {t.function.name} — {t.function.description.slice(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          {/* Arguments JSON Editor */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Arguments (JSON)</label>
              {jsonError ? (
                <span className="text-[10px] text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 animate-pulse" /> Malformed JSON
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Valid format
                </span>
              )}
            </div>
            <textarea
              value={argsJson}
              onChange={(e) => setArgsJson(e.target.value)}
              rows={isExpanded ? 10 : 5}
              className="w-full font-mono text-[11px] bg-black/40 border border-border-brand/40 focus:border-accent-brand rounded-xl p-3 text-text-primary outline-none resize-y transition-all"
              placeholder='{"key": "value"}'
            />
            {jsonError && (
              <p className="text-[10px] text-rose-400/90 font-mono bg-rose-950/20 border border-rose-900/30 rounded-lg p-2 leading-relaxed">
                {jsonError}
              </p>
            )}
          </div>

          {/* Optional Context Configs */}
          <details className="group border border-border-brand/20 rounded-xl bg-bg-app/10 overflow-hidden">
            <summary className="flex items-center justify-between px-3 py-2 cursor-pointer select-none text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:bg-bg-app/30 hover:text-text-primary transition-all">
              <span>Execution Context</span>
              <span className="text-text-secondary group-open:rotate-180 transition-transform duration-200">▼</span>
            </summary>
            <div className="p-3 border-t border-border-brand/20 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-text-secondary">AppConfig JSON:</span>
                <textarea
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
                  rows={4}
                  className="w-full font-mono text-[10px] bg-black/40 border border-border-brand/30 rounded-lg p-2 outline-none focus:border-accent-brand"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-secondary">chatStartDate:</span>
                  <input
                    type="text"
                    value={chatStartDate}
                    onChange={(e) => setChatStartDate(e.target.value)}
                    className="bg-black/40 border border-border-brand/30 rounded-lg px-2.5 py-1.5 outline-none focus:border-accent-brand text-[10px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-secondary">chatEndDate:</span>
                  <input
                    type="text"
                    value={chatEndDate}
                    onChange={(e) => setChatEndDate(e.target.value)}
                    className="bg-black/40 border border-border-brand/30 rounded-lg px-2.5 py-1.5 outline-none focus:border-accent-brand text-[10px]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-text-secondary">activeModel:</span>
                <input
                  type="text"
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value)}
                  className="bg-black/40 border border-border-brand/30 rounded-lg px-2.5 py-1.5 outline-none focus:border-accent-brand text-[10px]"
                />
              </div>
            </div>
          </details>

          {/* Action Trigger button */}
          <button
            onClick={run}
            disabled={running || !!jsonError}
            className={`w-full py-2.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              running || !!jsonError 
                ? "bg-bg-app border border-border-brand/30 text-text-secondary cursor-not-allowed" 
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg active:scale-[0.98]"
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {running ? "Executing tool..." : "Run Tool"}
          </button>
        </div>

        {/* Right Hand Column (for output and results, side-by-side in expanded mode, otherwise stacked bottom in vertical view) */}
        <div className="flex flex-col gap-4">
          
          {/* Error Output */}
          {rawError && (
            <div className="flex flex-col gap-1 bg-rose-950/20 border border-rose-900/40 rounded-xl p-3 text-rose-400">
              <span className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Execution Error
              </span>
              <pre className="font-mono text-[10.5px] whitespace-pre-wrap break-all select-text overflow-auto max-h-[150px]">
                {rawError}
              </pre>
            </div>
          )}

          {/* Result Output */}
          {result ? (
            <div className="flex-1 flex flex-col gap-1.5 border border-border-brand/30 rounded-xl overflow-hidden bg-black/20 min-h-[180px]">
              <div className="flex items-center justify-between px-3 py-2 bg-bg-app border-b border-border-brand/20 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                <span>Result (Role: {result.role})</span>
                {result.name && <span>Tool: {result.name}</span>}
              </div>
              <pre className="flex-1 font-mono text-[10.5px] p-3 text-text-primary select-text overflow-y-auto whitespace-pre-wrap break-words">
                {result.content}
              </pre>
            </div>
          ) : (
            !rawError && (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border-brand/20 rounded-xl p-6 text-text-secondary/60 select-none min-h-[180px]">
                <span className="text-2xl mb-1">💡</span>
                <p className="text-[10px] text-center max-w-[200px]">Run a tool using valid JSON arguments to inspect its output response here</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default ToolExecutorTestPanel;
