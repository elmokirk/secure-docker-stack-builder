import { useEffect, useMemo, useState } from "react";
import { renderStack } from "./core/renderer";
import type { BuilderSelection, ProjectPack, StackPreset } from "./core/types";
import { ComposeEditor } from "./editor/ComposeEditor";
import { EditorErrorBoundary } from "./editor/EditorErrorBoundary";
import { MarkdownOutput } from "./editor/MarkdownOutput";
import { findProject, projects } from "./projects";

type Tab = "compose" | "env" | "guide" | "qa" | "security" | "config";

export function App() {
  const [projectId, setProjectId] = useState(projects[0].id);
  const project = useMemo(() => findProject(projectId), [projectId]);
  const [selection, setSelection] = useState<BuilderSelection>(() => initialSelection(projects[0]));
  const [tab, setTab] = useState<Tab>("compose");
  const [editedCompose, setEditedCompose] = useState<string | null>(null);

  useEffect(() => {
    const nextProject = findProject(projectId);
    setSelection(initialSelection(nextProject));
  }, [projectId]);

  const result = useMemo(() => renderStack(project, selection), [project, selection]);
  const selectedModules = new Set(selection.moduleIds);
  const composeText = editedCompose ?? result.composeYaml;
  const composeEdited = editedCompose !== null && editedCompose !== result.composeYaml;

  function applyPreset(presetId: string) {
    const preset = project.presets.find((item) => item.id === presetId) ?? project.presets[0];
    setSelection({
      projectId: project.id,
      targetId: preset.targetId,
      moduleIds: preset.moduleIds,
      portOverrides: {}
    });
    setEditedCompose(null);
  }

  function toggleModule(moduleId: string) {
    const moduleIds = selectedModules.has(moduleId)
      ? selection.moduleIds.filter((id) => id !== moduleId)
      : [...selection.moduleIds, moduleId];
    setSelection({ ...selection, moduleIds });
    setEditedCompose(null);
  }

  function setPort(portId: string, value: number) {
    setSelection({
      ...selection,
      portOverrides: { ...(selection.portOverrides ?? {}), [portId]: value }
    });
    setEditedCompose(null);
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <main className="shell">
      <aside className="panel controls">
        <div>
          <p className="eyebrow">Secure Docker</p>
          <h1>Stack Builder</h1>
          <p className="muted">
            Schema-driven Compose generation with policy gates, dynamic ports, env templates, QA commands, and agent-readable risk output.
          </p>
        </div>

        <label className="field">
          <span>Project</span>
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Preset</span>
          <select value={findActivePreset(project, selection)?.id ?? ""} onChange={(event) => applyPreset(event.target.value)}>
            {project.presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Target</span>
          <select value={selection.targetId} onChange={(event) => setSelection({ ...selection, targetId: event.target.value })}>
            {project.targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
        </label>

        <section>
          <div className="section-title">
            <h2>Modules</h2>
            <span>{selection.moduleIds.length} selected</span>
          </div>
          <div className="module-list">
            {project.modules.map((module) => (
              <label className="module-row" key={module.id}>
                <input type="checkbox" checked={selectedModules.has(module.id)} onChange={() => toggleModule(module.id)} />
                <span>
                  <strong>{module.label}</strong>
                  <small>{module.description}</small>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <div className="section-title">
            <h2>Ports</h2>
            <span>{result.ports.filter((port) => port.published).length} published</span>
          </div>
          {result.ports.length === 0 ? (
            <p className="muted compact">No host ports in this selection.</p>
          ) : (
            <div className="ports">
              {result.ports.map((port) => (
                <label className="field inline" key={port.id}>
                  <span>{port.label}</span>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={port.hostPort ?? ""}
                    disabled={!port.published}
                    onChange={(event) => setPort(port.id, Number(event.target.value))}
                  />
                </label>
              ))}
            </div>
          )}
        </section>

        <section className={`risk ${result.status}`}>
          <div className="section-title">
            <h2>Risk Status</h2>
            <span>{result.riskLevel}</span>
          </div>
          {composeEdited && <p className="warning">Compose was edited manually. Treat this export as advanced and re-run Docker validation.</p>}
          {result.issues.length === 0 ? (
            <p>Production gates are clear for the selected target.</p>
          ) : (
            <ul>
              {result.issues.map((issue) => (
                <li key={`${issue.code}-${issue.message}`}>
                  <strong>{issue.severity}</strong> {issue.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      <section className="panel output">
        <div className="tabs">
          {(["compose", "env", "guide", "qa", "security", "config"] as Tab[]).map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </div>

        {tab === "compose" && (
          <ComposeOutputArea
            title="docker-compose.yaml"
            value={composeText}
            edited={composeEdited}
            onChange={setEditedCompose}
            onCopy={() => copy(composeText)}
            onReset={() => setEditedCompose(null)}
          />
        )}
        {tab === "env" && <MarkdownOutput title=".env.example" value={result.envExample} asCodeBlock onCopy={copy} />}
        {tab === "guide" && <MarkdownOutput title="SETUP.md" value={result.guideMarkdown} onCopy={copy} />}
        {tab === "qa" && <MarkdownOutput title="QA.md" value={result.qaMarkdown} onCopy={copy} />}
        {tab === "security" && <OutputArea title="risk-report.json" value={result.riskReportJson} onCopy={() => copy(result.riskReportJson)} />}
        {tab === "config" && <OutputArea title="stack-builder.config.json" value={result.stackConfigJson} onCopy={() => copy(result.stackConfigJson)} />}
      </section>
    </main>
  );
}

function ComposeOutputArea(props: {
  title: string;
  value: string;
  edited: boolean;
  onChange: (value: string) => void;
  onCopy: () => void;
  onReset: () => void;
}) {
  return (
    <div className="output-area">
      <div className="output-header">
        <div>
          <h2>{props.title}</h2>
          {props.edited && <p className="output-note">Manual edit mode. Reset to generated output before treating this as policy-validated.</p>}
        </div>
        <div className="output-actions">
          {props.edited && <button onClick={props.onReset}>Reset generated</button>}
          <button onClick={props.onCopy}>Copy</button>
        </div>
      </div>
      <div className="code-editor-frame">
        <EditorErrorBoundary
          fallback={
            <textarea
              className="editor-fallback"
              spellCheck={false}
              value={props.value}
              onChange={(event) => props.onChange(event.target.value)}
            />
          }
        >
          <ComposeEditor value={props.value} editable onChange={props.onChange} />
        </EditorErrorBoundary>
      </div>
    </div>
  );
}

function OutputArea(props: {
  title: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  onCopy: () => void;
}) {
  return (
    <div className="output-area">
      <div className="output-header">
        <h2>{props.title}</h2>
        <button onClick={props.onCopy}>Copy</button>
      </div>
      <textarea
        spellCheck={false}
        readOnly={!props.editable}
        value={props.value}
        onChange={(event) => props.onChange?.(event.target.value)}
      />
    </div>
  );
}

function initialSelection(project: ProjectPack): BuilderSelection {
  const preset = project.presets[0];
  return {
    projectId: project.id,
    targetId: preset.targetId,
    moduleIds: preset.moduleIds,
    portOverrides: {}
  };
}

function findActivePreset(project: ProjectPack, selection: BuilderSelection): StackPreset | undefined {
  const selected = [...selection.moduleIds].sort().join(",");
  return project.presets.find((preset) => preset.targetId === selection.targetId && [...preset.moduleIds].sort().join(",") === selected);
}
