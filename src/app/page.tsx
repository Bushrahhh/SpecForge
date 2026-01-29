import Link from 'next/link';
import InputForm from '@/components/InputForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-6 selection:bg-orange-500 selection:text-white">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 z-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      {/* Glowing Orb Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-600 rounded-full blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-600 rounded-full blur-[128px] opacity-20"></div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-mono font-medium text-orange-300 bg-orange-900/30 rounded-full border border-orange-700/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            v1.0 BETA
          </div>

          <h1 className="text-7xl font-extrabold tracking-tight text-white">
            Spec<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Forge</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Transform unstructured ideas into engineer-ready specifications.
            <span className="block text-slate-500 mt-2 text-sm">Powered by Large Language Models & Graph Reasoning.</span>
          </p>
        </div>

        {/* Main Input Card */}
        <div className="w-full bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/50 border border-slate-800 overflow-hidden">
          {/* Mac-style Window Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>   {/* Close */}
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div> {/* Minimize */}
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div> {/* Maximize */}
          </div>

          <div className="p-8">
            <InputForm />

            <div className="mt-8 flex justify-center">
              <Link href="/dashboard" className="w-full sm:w-auto group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-orange-500">
                Generate Specification
                <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}