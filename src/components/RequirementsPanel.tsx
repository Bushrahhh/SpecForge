export default function RequirementsPanel() {
  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
      <div className="bg-slate-950/50 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
        <h3 className="font-semibold text-xs text-orange-400 font-mono uppercase tracking-widest">Requirements.json</h3>
        <div className="text-[10px] text-slate-500 border border-slate-800 px-2 py-0.5 rounded">READ ONLY</div>
      </div>
      
      <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
        {/* Skeleton Loader Effect - Dark Mode */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-3 py-1">
              <div className="h-2 bg-slate-800 rounded w-1/3"></div>
              <div className="h-2 bg-slate-800/50 rounded w-full"></div>
              <div className="h-2 bg-slate-800/50 rounded w-5/6"></div>
            </div>
          </div>
        ))}
        
        <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
           <p className="text-xs text-slate-600 font-mono animate-pulse">Waiting for LLM stream...</p>
        </div>
      </div>
    </div>
  );
}