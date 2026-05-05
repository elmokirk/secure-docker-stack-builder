import { isValidElement, useMemo, useState } from "react";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Copy } from "lucide-react";
import Markdown from "react-markdown";

type OutputMode = "rendered" | "source";

interface MarkdownOutputProps {
  title: string;
  value: string;
  defaultMode?: OutputMode;
  asCodeBlock?: boolean;
  onCopy: (text: string) => void;
}

export function MarkdownOutput({ title, value, defaultMode = "rendered", asCodeBlock = false, onCopy }: MarkdownOutputProps) {
  const [mode, setMode] = useState<OutputMode>(defaultMode);
  const plainText = useMemo(() => (asCodeBlock ? value.trimEnd() : markdownToPlainText(value)), [asCodeBlock, value]);
  const renderedLabel = asCodeBlock ? "Code" : "Rendered";
  const sourceLabel = asCodeBlock ? "Raw" : "Markdown";

  return (
    <div className="output-area">
      <div className="output-header">
        <div>
          <h2>{title}</h2>
          <p className="output-note muted-note">
            {mode === "rendered" ? (asCodeBlock ? "Rendered code view" : "Rendered markdown view") : `${sourceLabel} source view`}
          </p>
        </div>
        <div className="output-actions">
          <div className="segmented-control" aria-label="Output view mode">
            <button className={mode === "rendered" ? "active" : ""} onClick={() => setMode("rendered")}>
              {renderedLabel}
            </button>
            <button className={mode === "source" ? "active" : ""} onClick={() => setMode("source")}>
              {sourceLabel}
            </button>
          </div>
          <button onClick={() => onCopy(plainText)}>
            <Copy size={14} aria-hidden="true" />
            <span>Copy plain text</span>
          </button>
          <button onClick={() => onCopy(value)}>
            <Copy size={14} aria-hidden="true" />
            <span>{asCodeBlock ? "Copy raw" : "Copy markdown"}</span>
          </button>
        </div>
      </div>

      {mode === "rendered" ? (
        asCodeBlock ? (
          <CodePreview value={value} onCopy={onCopy} />
        ) : (
          <div className="markdown-preview">
            <Markdown skipHtml components={markdownComponents(onCopy)}>{value}</Markdown>
          </div>
        )
      ) : (
        <textarea spellCheck={false} readOnly value={value} />
      )}
    </div>
  );
}

function CodePreview({ value, onCopy }: { value: string; onCopy: (text: string) => void }) {
  const code = value.trimEnd();
  return (
    <div className="markdown-preview">
      <pre className="copyable-code-block code-preview-block">
        <button className="code-copy-button" onClick={() => onCopy(code)} title="Copy code" aria-label="Copy code">
          <Copy size={14} aria-hidden="true" />
          <span>Copy</span>
        </button>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const markdownComponents = (onCopy: (text: string) => void) => ({
  a(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
    return <a {...props} target="_blank" rel="noreferrer" />;
  },
  code(props: HTMLAttributes<HTMLElement>) {
    return <code {...props} />;
  },
  pre(props: HTMLAttributes<HTMLPreElement>) {
    const code = extractText(props.children).replace(/\n$/, "");
    return (
      <pre {...props} className={`copyable-code-block ${props.className ?? ""}`.trim()}>
        <button className="code-copy-button" onClick={() => onCopy(code)} title="Copy code" aria-label="Copy code">
          <Copy size={14} aria-hidden="true" />
          <span>Copy</span>
        </button>
        {props.children}
      </pre>
    );
  }
});

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return extractText(node.props.children);
  return "";
}

function markdownToPlainText(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/```$/, ""))
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}
