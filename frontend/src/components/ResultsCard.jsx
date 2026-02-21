import { useState } from "react";

const SECTIONS = [
  { key: "hook", label: "Hook (First 3 Seconds)" },
  { key: "scripts", label: "Scripts" },
  { key: "shot_list", label: "Shot List" },
  { key: "captions", label: "On-Screen Captions" },
  { key: "cta", label: "Call to Action" },
  { key: "post_caption", label: "Post Caption" },
  { key: "hashtags", label: "Hashtags" },
];

function copyText(text) {
  navigator.clipboard.writeText(typeof text === "string" ? text : JSON.stringify(text, null, 2));
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        copyText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs text-gray-400 hover:text-indigo-400 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function RegenButton({ section, onRegenerate, loading }) {
  return (
    <button
      onClick={() => onRegenerate(section)}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-amber-400 transition-colors disabled:opacity-50"
    >
      Regenerate
    </button>
  );
}

function renderSection(key, data) {
  if (!data) return <p className="text-gray-500 italic">No data</p>;

  if (key === "scripts" && typeof data === "object") {
    return (
      <div className="space-y-4">
        {Object.entries(data).map(([duration, script]) => (
          <div key={duration} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-indigo-400 uppercase">{duration}</span>
              <CopyButton text={script} />
            </div>
            <p className="text-gray-200 text-sm whitespace-pre-wrap">{script}</p>
          </div>
        ))}
      </div>
    );
  }

  if (key === "shot_list" && Array.isArray(data)) {
    return (
      <div className="space-y-3">
        {data.map((shot, i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-4 text-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">
                Shot {shot.shot_number || i + 1}
              </span>
              {shot.duration && (
                <span className="text-xs text-gray-500">{shot.duration}</span>
              )}
            </div>
            {shot.visual && <p className="text-gray-300"><strong className="text-gray-400">Visual:</strong> {shot.visual}</p>}
            {shot.audio && <p className="text-gray-300 mt-1"><strong className="text-gray-400">Audio:</strong> {shot.audio}</p>}
            {shot.text_overlay && <p className="text-gray-300 mt-1"><strong className="text-gray-400">Text:</strong> {shot.text_overlay}</p>}
          </div>
        ))}
      </div>
    );
  }

  if (key === "hashtags" && Array.isArray(data)) {
    return (
      <div className="flex flex-wrap gap-2">
        {data.map((tag, i) => (
          <span
            key={i}
            className="bg-indigo-500/10 text-indigo-300 text-sm px-3 py-1 rounded-full border border-indigo-500/20"
          >
            #{tag.replace(/^#/, "")}
          </span>
        ))}
      </div>
    );
  }

  if (key === "captions" && Array.isArray(data)) {
    return (
      <ul className="space-y-2">
        {data.map((cap, i) => (
          <li key={i} className="text-gray-200 text-sm bg-gray-800/50 rounded-lg px-4 py-2">
            {cap}
          </li>
        ))}
      </ul>
    );
  }

  return <p className="text-gray-200 text-sm whitespace-pre-wrap">{String(data)}</p>;
}

function copyAll(result) {
  const parts = SECTIONS.map(({ key, label }) => {
    const data = result[key];
    if (!data) return "";
    if (key === "hashtags" && Array.isArray(data)) {
      return `## ${label}\n${data.map((t) => `#${t.replace(/^#/, "")}`).join(" ")}`;
    }
    if (key === "scripts" && typeof data === "object") {
      return `## ${label}\n${Object.entries(data).map(([d, s]) => `### ${d}\n${s}`).join("\n\n")}`;
    }
    if (key === "shot_list" && Array.isArray(data)) {
      return `## ${label}\n${data.map((s) => `Shot ${s.shot_number}: [${s.duration}] Visual: ${s.visual} | Audio: ${s.audio} | Text: ${s.text_overlay}`).join("\n")}`;
    }
    if (Array.isArray(data)) {
      return `## ${label}\n${data.join("\n")}`;
    }
    return `## ${label}\n${data}`;
  });
  copyText(parts.filter(Boolean).join("\n\n"));
}

export default function ResultsCard({ result, usage, onRegenerate, loading }) {
  const [allCopied, setAllCopied] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Generated Content</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              copyAll(result);
              setAllCopied(true);
              setTimeout(() => setAllCopied(false), 1500);
            }}
            className="btn-secondary text-sm"
          >
            {allCopied ? "Copied All!" : "Copy All"}
          </button>
        </div>
      </div>

      {usage && (
        <div className="card flex flex-wrap gap-4 text-xs text-gray-400">
          <span>Input: {usage.input_tokens} tokens</span>
          <span>Output: {usage.output_tokens} tokens</span>
          <span className={usage.cache_hit ? "text-green-400" : "text-gray-500"}>
            Cache: {usage.cache_hit ? `HIT (${usage.cache_read_tokens} read)` : "MISS"}
          </span>
          <span>Cost: ${usage.estimated_cost?.toFixed(4)}</span>
        </div>
      )}

      {SECTIONS.map(({ key, label }) => (
        <div key={key} className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wide">
              {label}
            </h3>
            <div className="flex gap-3">
              <CopyButton text={result[key]} />
              <RegenButton section={key} onRegenerate={onRegenerate} loading={loading} />
            </div>
          </div>
          {renderSection(key, result[key])}
        </div>
      ))}
    </div>
  );
}
