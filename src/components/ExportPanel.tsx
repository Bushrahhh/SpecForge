export default function ExportPanel() {
  return (
    <div className="flex gap-3 justify-end">
      <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition border border-slate-700 font-medium text-sm">
        Copy Markdown
      </button>
      <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition shadow-lg shadow-violet-900/20 font-medium text-sm flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        Export PDF
      </button>
    </div>
  );
}