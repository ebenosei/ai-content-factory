import { useState, useEffect } from "react";
import BriefForm from "./components/BriefForm";
import ResultsCard from "./components/ResultsCard";
import HistoryTable from "./components/HistoryTable";
import MetricsBadge from "./components/MetricsBadge";

const API = "/api";

export default function App() {
  const [tab, setTab] = useState("create");
  const [result, setResult] = useState(null);
  const [generationId, setGenerationId] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/history`);
      const data = await res.json();
      setHistory(data.generations || []);
    } catch {
      /* ignore */
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API}/metrics`);
      const data = await res.json();
      setMetrics(data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchMetrics();
  }, []);

  const handleSubmit = async (brief) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setUsage(null);
    try {
      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Generation failed");
      }
      const data = await res.json();
      setResult(data.result);
      setGenerationId(data.id);
      setUsage(data.usage);
      setTab("results");
      fetchHistory();
      fetchMetrics();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (section) => {
    if (!generationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generation_id: generationId, section }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Regeneration failed");
      }
      const data = await res.json();
      setResult(data.result);
      setUsage(data.usage);
      fetchMetrics();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewGeneration = async (id) => {
    try {
      const res = await fetch(`${API}/history/${id}`);
      const data = await res.json();
      setResult(data.result_data);
      setGenerationId(data.id);
      setUsage({
        input_tokens: data.input_tokens,
        output_tokens: data.output_tokens,
        cache_read_tokens: data.cache_read_tokens,
        cache_creation_tokens: data.cache_creation_tokens,
        estimated_cost: data.estimated_cost,
        cache_hit: data.cache_read_tokens > 0,
      });
      setTab("results");
    } catch {
      setError("Failed to load generation");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API}/history/${id}`, { method: "DELETE" });
      fetchHistory();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            <span className="text-indigo-400">AI</span> Content Factory
          </h1>
          <div className="flex items-center gap-2">
            <MetricsBadge metrics={metrics} />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px">
            {[
              { id: "create", label: "Create" },
              { id: "results", label: "Results" },
              { id: "history", label: "History" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  if (t.id === "history") fetchHistory();
                  if (t.id === "history" || t.id === "results") fetchMetrics();
                }}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === t.id
                    ? "bg-gray-950 text-indigo-400 border border-gray-800 border-b-gray-950"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 ml-4">
              Dismiss
            </button>
          </div>
        )}

        {tab === "create" && (
          <BriefForm onSubmit={handleSubmit} loading={loading} />
        )}

        {tab === "results" && (
          result ? (
            <ResultsCard
              result={result}
              usage={usage}
              onRegenerate={handleRegenerate}
              loading={loading}
            />
          ) : (
            <div className="text-center text-gray-500 py-20">
              <p className="text-lg">No results yet</p>
              <p className="text-sm mt-1">Submit a brand brief to generate content</p>
            </div>
          )
        )}

        {tab === "history" && (
          <HistoryTable
            history={history}
            onView={handleViewGeneration}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}
