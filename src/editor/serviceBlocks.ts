import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, type DecorationSet, type EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";

export interface ServiceBlock {
  name: string;
  startLine: number;
  endLine: number;
  colorIndex: number;
}

interface ServiceStart {
  name: string;
  line: number;
}

export function findServiceBlocks(yamlText: string): ServiceBlock[] {
  if (!yamlText.trim()) return [];

  const lines = yamlText.split(/\r?\n/);
  const servicesLineIndex = lines.findIndex((line) => /^services:\s*(?:#.*)?$/.test(line));
  if (servicesLineIndex === -1) return [];

  const sectionEnd = findServicesSectionEnd(lines, servicesLineIndex);
  const starts: ServiceStart[] = [];

  for (let index = servicesLineIndex + 1; index < sectionEnd; index += 1) {
    const match = /^ {2}([A-Za-z0-9_.-]+):\s*(?:#.*)?$/.exec(lines[index]);
    if (match) {
      starts.push({ name: match[1], line: index + 1 });
    }
  }

  return starts.map((start, index) => {
    const next = starts[index + 1];
    return {
      name: start.name,
      startLine: start.line,
      endLine: next ? next.line - 1 : sectionEnd,
      colorIndex: index % 4
    };
  });
}

export function serviceBlockDecorations() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildServiceDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildServiceDecorations(update.view);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations
    }
  );
}

function findServicesSectionEnd(lines: string[], servicesLineIndex: number): number {
  for (let index = servicesLineIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\S/.test(line) && !/^services:\s*(?:#.*)?$/.test(line)) {
      return index;
    }
  }
  return lines.length;
}

function buildServiceDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const blocks = findServiceBlocks(view.state.doc.toString());

  for (const block of blocks) {
    const blockClass = `cm-service-block cm-service-block-${block.colorIndex}`;
    for (let lineNumber = block.startLine; lineNumber <= block.endLine && lineNumber <= view.state.doc.lines; lineNumber += 1) {
      const line = view.state.doc.line(lineNumber);
      const isStart = lineNumber === block.startLine;
      builder.add(
        line.from,
        line.from,
        Decoration.line({
          class: `${blockClass}${isStart ? " cm-service-start" : ""}`
        })
      );

      if (isStart) {
        const match = /^(\s*)([A-Za-z0-9_.-]+)(:)/.exec(line.text);
        if (match) {
          const from = line.from + match[1].length;
          const to = from + match[2].length;
          builder.add(from, to, Decoration.mark({ class: "cm-service-name" }));
        }
      }
    }
  }

  return builder.finish();
}
