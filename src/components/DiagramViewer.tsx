export default function DiagramViewer() {
  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <h3 className="font-semibold text-xs text-amber-400 font-mono uppercase tracking-widest">Architecture_Map.mmd</h3>
        <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
        </div>
      </div>
      
      {/* The "Canvas" area with Dark Grid Pattern */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden group">
         <div className="absolute inset-0 z-0 opacity-10" 
              style={{ backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(to right, #475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
         </div>
         
         <div className="relative z-10 w-full h-full flex items-center justify-center">
            <div className="text-slate-600 text-sm font-mono flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-slate-900 border border-slate-800 mb-2 ggroup-hover:border-orange-500/50 transition-colors">
                  <svg className="w-8 h-8 opacity-50 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <span>Rendering System Architecture...</span>
            </div>
         </div>
      </div>
    </div>
  );
}