export default function InputForm() {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-slate-300 font-mono uppercase tracking-wider">
          Project Brief
        </label>
        <span className="text-xs text-slate-500 font-mono">Markdown supported</span>
      </div>
      
      <div className="relative group">
        {/* Glow effect behind the input */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
        
        <div className="relative w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 transition-all hover:bg-slate-900 hover:border-violet-500/50 cursor-pointer border-dashed border-2">
          <svg className="w-12 h-12 mb-4 text-slate-600 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="font-medium text-slate-400 group-hover:text-slate-200">Drop your project proposal PDF here</p>
          <p className="text-sm mt-1 text-slate-600">or paste text directly</p>
        </div>
      </div>
    </div>
  );
}