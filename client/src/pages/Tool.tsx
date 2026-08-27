// Design reminder: this page is the entry point to the graph workbench. Keep navigation quiet and let the editor provide the visual focus.

import { BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import GraphBuilder from "@/components/GraphBuilder";
import { useLocation } from "wouter";

export default function Tool() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#f4f3ef]">
      <header className="border-b border-[#dcd9d1] bg-[#fbfaf7]">
        <div className="container flex items-center justify-between py-4">
          <button className="flex items-center gap-3 text-left" onClick={() => setLocation("/")} aria-label="Go to Dynamo Exporter home">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#182129] text-[#55d6c8] shadow-lg"><Zap size={19} /></span>
            <span><strong className="block text-[16px] tracking-[-0.02em] text-[#15202a]">Dynamo Exporter</strong><small className="block text-[11px] text-[#7a7770]">Offline graph workbench</small></span>
          </button>
          <nav className="flex items-center gap-2" aria-label="Primary navigation">
            <Button variant="outline" size="sm" onClick={() => setLocation("/docs")} className="gap-2"><BookOpen size={14} /> Docs</Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/")}>Home</Button>
          </nav>
        </div>
      </header>
      <main><GraphBuilder /></main>
      <footer className="border-t border-[#dcd9d1] bg-[#fbfaf7] px-6 py-6 text-center text-[11px] text-[#7a7770]">Offline-first graph builder for AEC automation teams · No server required for deterministic export.</footer>
    </div>
  );
}
