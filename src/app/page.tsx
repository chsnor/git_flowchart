import { GitFork } from 'lucide-react';
import { FlowExplorer } from '@/components/FlowExplorer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#000000] text-[#ededed] flex flex-col font-sans selection:bg-white/20 selection:text-white bg-grid-pattern relative">

      <header className="border-b border-[#262626] bg-[#000000]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#171717] border border-[#262626] flex items-center justify-center text-white">
              <GitFork className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-xs tracking-wider text-white uppercase font-mono">
              Git Flowchart
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/chsnor/git_flowcahrt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#262626] bg-[#0a0a0a] hover:bg-[#171717]"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="font-mono text-[11px]">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <FlowExplorer />
    </main>
  );
}
