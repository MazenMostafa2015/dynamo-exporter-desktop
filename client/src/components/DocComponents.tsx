import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeExample, TableData } from "@/lib/docs-data";

export function CodeBlock({ example }: { example: CodeExample }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(example.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languageColors: Record<string, string> = {
    javascript: "bg-yellow-50 border-yellow-200",
    typescript: "bg-blue-50 border-blue-200",
    python: "bg-indigo-50 border-indigo-200",
    json: "bg-green-50 border-green-200",
    text: "bg-gray-50 border-gray-200",
  };

  const languageLabels: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    json: "JSON",
    text: "Text",
  };

  return (
    <div className={`rounded-lg border-2 overflow-hidden ${languageColors[example.language] || "bg-gray-50 border-gray-200"}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-black/5">
        <div>
          {example.title && <span className="font-semibold text-sm">{example.title}</span>}
          <span className="text-xs text-gray-600 ml-2">{languageLabels[example.language]}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono">
        <code>{example.code}</code>
      </pre>
    </div>
  );
}

export function DocTable({ table }: { table: TableData }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {table.headers.map((header, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold text-gray-900">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContentRenderer({ content }: { content: string }) {
  // Simple markdown-like rendering
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/);

  return (
    <div className="space-y-4 text-gray-700 leading-relaxed">
      {parts.map((part, i) => {
        if (!part) return null;
        if (part === "\n") return <br key={i} />;
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-gray-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="bg-gray-100 px-2 py-1 rounded font-mono text-sm text-red-600">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  icon,
  onClick,
  isActive = false,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}

export function SubsectionNav({
  subsections,
  activeId,
  onSelect,
}: {
  subsections: Array<{ id: string; title: string }>;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="space-y-1">
      {subsections.map((sub) => (
        <button
          key={sub.id}
          onClick={() => onSelect(sub.id)}
          className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
            activeId === sub.id
              ? "bg-blue-100 text-blue-900 font-semibold"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {sub.title}
        </button>
      ))}
    </nav>
  );
}
