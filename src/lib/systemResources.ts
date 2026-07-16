import { SystemResources } from "../types";

export const parseCpuPercentage = (raw: string): number | null => {
  const match = raw.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

export const parseRamInfo = (raw: string) => {
  const numbers = raw.match(/\d+/g);
  if (numbers && numbers.length >= 2) {
    const freeKB = parseInt(numbers[0], 10);
    const totalKB = parseInt(numbers[1], 10);
    const usedKB = totalKB - freeKB;
    return {
      free: freeKB / (1024 * 1024),
      total: totalKB / (1024 * 1024),
      used: usedKB / (1024 * 1024),
      usedPercent: (usedKB / totalKB) * 100
    };
  }
  return null;
};

export const parseGpuInfo = (raw: string) => {
  if (raw.includes("Failed to execute") || raw.includes("Error:") || !raw.includes("NVIDIA-SMI")) {
    return null;
  }
  let name = "NVIDIA GPU";
  let usedVram = 0;
  let totalVram = 0;
  let temp = "";
  let util = "";
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("MiB /")) {
      const vramMatch = line.match(/(\d+)MiB\s*\/\s*(\d+)MiB/);
      if (vramMatch) {
        usedVram = parseInt(vramMatch[1], 10);
        totalVram = parseInt(vramMatch[2], 10);
      }
      const tempMatch = line.match(/(\d+)C/);
      if (tempMatch) temp = tempMatch[1] + "°C";
      const utilMatch = line.match(/(\d+)%/);
      if (utilMatch) util = utilMatch[1] + "%";
      if (i > 0) {
        const prevLine = lines[i - 1];
        const nameMatch = prevLine.match(/\|\s*\d+\s+([^|]+?)\s+WDDM/i) || prevLine.match(/\|\s*\d+\s+([^|]+?)\s+WDM/i) || prevLine.match(/\|\s*\d+\s+([^|]+)/);
        if (nameMatch) name = nameMatch[1].trim();
      }
    }
  }
  return { 
    name, 
    usedVram: usedVram / 1024, 
    totalVram: totalVram / 1024, 
    temp, 
    util, 
    usedPercent: totalVram > 0 ? (usedVram / totalVram) * 100 : 0 
  };
};

export const formatSystemResources = (res: SystemResources): string => {
  const cpuVal = parseCpuPercentage(res.cpu_raw);
  const ramVal = parseRamInfo(res.ram_raw);
  const gpuVal = parseGpuInfo(res.gpu_raw);

  let formatted = "### Host System Resources Telemetry:\n";
  formatted += `- **CPU Load**: ${cpuVal !== null ? `${cpuVal}%` : "Unknown / Failed to query"}\n`;

  if (ramVal) {
    formatted += `- **RAM Usage**: ${ramVal.used.toFixed(2)} GB used / ${ramVal.total.toFixed(2)} GB total (${ramVal.usedPercent.toFixed(0)}% utilization, ${ramVal.free.toFixed(2)} GB free)\n`;
  } else {
    formatted += `- **RAM Usage**: Unknown / Failed to query\n`;
  }

  if (gpuVal) {
    formatted += `- **NVIDIA GPU**: ${gpuVal.name}\n`;
    formatted += `  - GPU Load: ${gpuVal.util || "Unknown"}\n`;
    formatted += `  - VRAM: ${gpuVal.usedVram.toFixed(2)} GB used / ${gpuVal.totalVram.toFixed(2)} GB total (${gpuVal.usedPercent.toFixed(0)}% utilization)\n`;
    formatted += `  - Temperature: ${gpuVal.temp || "Unknown"}\n`;
  } else {
    formatted += `- **NVIDIA GPU**: None detected or nvidia-smi failed\n`;
  }

  if (res.ollama_ps_raw && res.ollama_ps_raw.trim() && !res.ollama_ps_raw.includes("Failed") && !res.ollama_ps_raw.includes("Error")) {
    formatted += `- **Active Ollama Models in Memory**:\n\`\`\`\n${res.ollama_ps_raw.trim()}\n\`\`\`\n`;
  } else {
    formatted += `- **Active Ollama Models**: None currently reported in memory.\n`;
  }

  return formatted;
};
