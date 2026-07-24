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

export const formatSystemResources = (res: SystemResources): string => {
  const cpuVal = parseCpuPercentage(res.cpu_raw);
  const ramVal = parseRamInfo(res.ram_raw);

  let formatted = "### Host System Resources Telemetry:\n";
  formatted += `- **CPU Load**: ${cpuVal !== null ? `${cpuVal}%` : "Unknown / Failed to query"}\n`;

  if (ramVal) {
    formatted += `- **RAM Usage**: ${ramVal.used.toFixed(2)} GB used / ${ramVal.total.toFixed(2)} GB total (${ramVal.usedPercent.toFixed(0)}% utilization, ${ramVal.free.toFixed(2)} GB free)\n`;
  } else {
    formatted += `- **RAM Usage**: Unknown / Failed to query\n`;
  }

  if (res.ollama_ps_raw && res.ollama_ps_raw.trim() && !res.ollama_ps_raw.includes("Failed") && !res.ollama_ps_raw.includes("Error")) {
    formatted += `- **Active Ollama Models in Memory**:\n\`\`\`\n${res.ollama_ps_raw.trim()}\n\`\`\`\n`;
  } else {
    formatted += `- **Active Ollama Models**: None currently reported in memory.\n`;
  }

  return formatted;
};
