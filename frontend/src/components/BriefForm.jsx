import { useState } from "react";

const TONES = ["Funny", "Inspirational", "Educational", "Direct Response"];
const PLATFORMS = ["TikTok", "Instagram Reel", "YouTube Shorts"];
const GOALS = ["Awareness", "Lead Gen", "Sales", "Engagement"];

export default function BriefForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    brand_name: "",
    product_description: "",
    target_audience: "",
    tone: TONES[0],
    platform: PLATFORMS[0],
    goal: GOALS[0],
    competitor_urls: "",
  });

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-6">Brand Brief</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Brand Name *
            </label>
            <input
              type="text"
              required
              value={form.brand_name}
              onChange={update("brand_name")}
              placeholder="e.g. Acme Co"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Product / Service Description *
            </label>
            <textarea
              required
              rows={3}
              value={form.product_description}
              onChange={update("product_description")}
              placeholder="Describe your product or service..."
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Target Audience *
            </label>
            <input
              type="text"
              required
              value={form.target_audience}
              onChange={update("target_audience")}
              placeholder="e.g. Gen Z fitness enthusiasts aged 18-25"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Tone
              </label>
              <select
                value={form.tone}
                onChange={update("tone")}
                className="input-field"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Platform
              </label>
              <select
                value={form.platform}
                onChange={update("platform")}
                className="input-field"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Goal
              </label>
              <select
                value={form.goal}
                onChange={update("goal")}
                className="input-field"
              >
                {GOALS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Competitor URLs / References
              <span className="text-gray-500 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={form.competitor_urls}
              onChange={update("competitor_urls")}
              placeholder="Paste URLs or describe reference content"
              className="input-field"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full text-center flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Spinner /> Generating Content...
          </>
        ) : (
          "Generate Content Pipeline"
        )}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
