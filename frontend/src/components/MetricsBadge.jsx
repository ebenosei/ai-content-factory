import { useState } from "react";

export default function MetricsBadge({ metrics }) {
  const [open, setOpen] = useState(false);

  if (!metrics || metrics.total_requests === 0) {
    return (
      <div className="text-xs text-gray-500 px-3 py-1.5 bg-gray-800 rounded-lg">
        No usage yet
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      >
        <span className="text-gray-400">{metrics.total_requests} requests</span>
        <span className="text-gray-600">|</span>
        <span className="text-green-400">${metrics.total_cost?.toFixed(2)}</span>
        <span className="text-gray-600">|</span>
        <span className={metrics.cache_hit_rate > 50 ? "text-green-400" : "text-amber-400"}>
          {metrics.cache_hit_rate}% cache
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 card z-50 shadow-xl shadow-black/30">
            <h3 className="text-sm font-semibold text-white mb-3">
              API Usage — {metrics.month}
            </h3>
            <div className="space-y-2 text-sm">
              <Row label="Total Requests" value={metrics.total_requests} />
              <Row label="Input Tokens" value={metrics.total_input_tokens?.toLocaleString()} />
              <Row label="Output Tokens" value={metrics.total_output_tokens?.toLocaleString()} />
              <Row label="Cache Read Tokens" value={metrics.total_cache_read_tokens?.toLocaleString()} />
              <Row label="Cache Creation Tokens" value={metrics.total_cache_creation_tokens?.toLocaleString()} />
              <div className="border-t border-gray-800 pt-2 mt-2">
                <Row label="Cache Hit Rate" value={`${metrics.cache_hit_rate}%`} highlight={metrics.cache_hit_rate > 50} />
                <Row label="Avg Tokens/Request" value={metrics.avg_tokens_per_request?.toLocaleString()} />
                <Row label="Avg Cost/Request" value={`$${metrics.avg_cost_per_request?.toFixed(4)}`} />
                <Row label="Monthly Total" value={`$${metrics.total_cost?.toFixed(4)}`} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={highlight ? "text-green-400 font-medium" : "text-gray-200"}>
        {value}
      </span>
    </div>
  );
}
