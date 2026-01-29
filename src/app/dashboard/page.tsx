import RequirementsPanel from '@/components/RequirementsPanel';
import DiagramViewer from '@/components/DiagramViewer';
import ExportPanel from '@/components/ExportPanel';

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
      {/* Top Navigation Bar */}
      <header className="mb-6 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl px-6 py-4 flex justify-between items-center sticky top-4 z-50">
        <div className="flex items-center gap-4">
           <div className="h-8 w-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">S</div>
           <h1 className="text-xl font-bold text-slate-100 tracking-tight">Project <span className="text-slate-600 mx-1">/</span> Specifications</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-emerald-950/30 border border-emerald-900/50 rounded-full flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-medium text-emerald-400">AI AGENT: ONLINE</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-130px)]">
        {/* Left Panel: Spec List */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
           <RequirementsPanel />
        </div>

        {/* Right Panel: Visualization & Tools */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
          <DiagramViewer />
          <div className="mt-auto">
            <ExportPanel />
          </div>
        </div>
      </div>
    </main>
  );
}