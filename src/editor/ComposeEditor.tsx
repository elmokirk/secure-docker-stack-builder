import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { indentUnit, syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { serviceBlockDecorations } from "./serviceBlocks";

interface ComposeEditorProps {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}

const yamlHighlight = HighlightStyle.define([
  { tag: t.keyword, color: "#78d7ff" },
  { tag: t.propertyName, color: "#8bd5ca" },
  { tag: t.definition(t.propertyName), color: "#9cdcfe" },
  { tag: t.string, color: "#f0c674" },
  { tag: t.number, color: "#b7e07a" },
  { tag: t.bool, color: "#d6a5ff" },
  { tag: t.null, color: "#d6a5ff" },
  { tag: t.comment, color: "#7f8a96", fontStyle: "italic" },
  { tag: t.operator, color: "#c6d0dc" },
  { tag: t.punctuation, color: "#8894a0" },
  { tag: t.variableName, color: "#ffcf80" }
]);

const editorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      backgroundColor: "#080a0d",
      color: "#e6eef7"
    },
    ".cm-scroller": {
      fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
      fontSize: "13px",
      lineHeight: "1.55",
      overflow: "auto"
    },
    ".cm-content": {
      minHeight: "100%",
      padding: "16px 0",
      caretColor: "#74d7c1",
      backgroundImage:
        "repeating-linear-gradient(to right, transparent 0, transparent calc(4ch - 1px), rgba(255, 255, 255, 0.045) calc(4ch - 1px), rgba(255, 255, 255, 0.045) 4ch)",
      backgroundPosition: "calc(22px + 1ch) 0",
      backgroundSize: "4ch 100%"
    },
    ".cm-line": {
      padding: "0 16px 0 22px"
    },
    ".cm-gutters": {
      backgroundColor: "#080a0d",
      borderRight: "1px solid #20262d",
      color: "#66717d"
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#141a20"
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(116, 215, 193, 0.08)"
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(116, 215, 193, 0.22)"
    },
    "&.cm-focused": {
      outline: "none"
    },
    ".cm-indent-guide": {
      boxShadow: "inset 1px 0 0 rgba(255, 255, 255, 0.07)"
    }
  },
  { dark: true }
);

const extensions = [
  yaml(),
  indentUnit.of("  "),
  syntaxHighlighting(yamlHighlight),
  serviceBlockDecorations(),
  editorTheme
];

export function ComposeEditor({ value, editable, onChange }: ComposeEditorProps) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      basicSetup={{
        foldGutter: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        indentOnInput: true,
        syntaxHighlighting: true
      }}
      editable={editable}
      readOnly={!editable}
      extensions={extensions}
      onChange={onChange}
    />
  );
}
