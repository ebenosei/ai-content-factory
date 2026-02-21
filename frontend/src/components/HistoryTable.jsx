export default function HistoryTable({ history, onView, onDelete }) {
  if (!history.length) {
    return (
      <div className="text-center text-gray-500 py-20">
        <p className="text-lg">No history yet</p>
        <p className="text-sm mt-1">Generated content will appear here</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Platform</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Tone</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Goal</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Cost</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-white font-medium">{item.brand_name}</td>
                <td className="px-4 py-3 text-gray-300 hidden sm:table-cell">{item.platform}</td>
                <td className="px-4 py-3 text-gray-300 hidden md:table-cell">{item.tone}</td>
                <td className="px-4 py-3 text-gray-300 hidden md:table-cell">{item.goal}</td>
                <td className="px-4 py-3 text-gray-400 font-mono hidden lg:table-cell">
                  ${item.estimated_cost?.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onView(item.id)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
