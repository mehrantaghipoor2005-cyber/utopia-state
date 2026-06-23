"use client";

const TOOL_LABELS: Record<string, string> = {
  get_current_datetime: "⏰ دریافت زمان",
  calculate: "🔢 محاسبه",
  manage_notes: "📝 یادداشت",
  set_reminder: "⏰ یادآور",
  get_weather: "🌤️ آب‌وهوا",
  web_search: "🔍 جستجو",
};

interface ToolIndicatorProps {
  tools: string[];
}

export default function ToolIndicator({ tools }: ToolIndicatorProps) {
  if (!tools.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2 px-2">
      {tools.map((tool) => (
        <span
          key={tool}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-violet-50 text-violet-600 border border-violet-200 animate-pulse"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          {TOOL_LABELS[tool] || tool}
        </span>
      ))}
    </div>
  );
}
