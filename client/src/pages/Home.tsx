import { ArrowRight, Code2, Zap, BookOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Dynamo Exporter</h1>
          </div>
          <Button onClick={() => setLocation("/docs")} variant="outline">
            Documentation
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                Generate Valid Dynamo Graphs
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  {" "}
                  Instantly
                </span>
              </h2>
              <p className="text-xl text-gray-600">
                The Dynamo Exporter transforms plain-English automation requests into production-ready `.dyn` files using Code Block nodes as the universal building block.
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-gray-900">Perfect for:</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  Revit automation workflows
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  BIM data processing
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  Parametric design scripts
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  AEC automation teams
                </li>
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => setLocation("/docs")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Explore Docs <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline">
                View on GitHub
              </Button>
            </div>
          </div>

          {/* Right: Visual Feature */}
          <div className="relative">
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <Code2 className="w-5 h-5 text-blue-600" />
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    Graph Specification
                  </span>
                </div>

                <div className="font-mono text-sm space-y-2 text-gray-700">
                  <div>
                    <span className="text-blue-600">const</span> scenario ={" "}
                    <span className="text-gray-600">{"{"}</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-purple-600">nodes</span>:{" "}
                    <span className="text-gray-600">[</span>
                  </div>
                  <div className="ml-8">
                    <span className="text-gray-600">{"{"}</span> id: <span className="text-green-600">"n1"</span>,
                  </div>
                  <div className="ml-12">
                    code: <span className="text-green-600">"cat = Categories.ByName(\"Rooms\");"</span>
                  </div>
                  <div className="ml-8">
                    <span className="text-gray-600">{"}"}</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-600">]</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{"}"}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Download className="w-4 h-4" />
                    <span>Exports to valid `.dyn` file</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white border-t border-slate-200">
        <div className="container max-w-7xl mx-auto px-4 py-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Key Features
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Code Block Strategy</h4>
              <p className="text-gray-600 text-sm">
                Every node is a simple Code Block containing one line of DesignScript. No complex metadata required.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Variable-Based Wiring</h4>
              <p className="text-gray-600 text-sm">
                Connections are based on variable names, not port indices. Simpler, more intuitive graph construction.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Full Documentation</h4>
              <p className="text-gray-600 text-sm">
                Comprehensive API reference, architecture guides, and real-world workflow examples.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="container max-w-7xl mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Quick Start
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Define Your Graph</h4>
                <p className="text-gray-600 text-sm mt-2">
                  Create a scenario object with nodes (DesignScript code) and edges (connections).
                </p>
              </div>
            </div>
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-300 to-transparent" />
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-600 text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Call the Exporter</h4>
                <p className="text-gray-600 text-sm mt-2">
                  Use `DynamoExporter.createDyn(scenario)` to generate the JSON.
                </p>
              </div>
            </div>
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-indigo-300 to-transparent" />
          </div>

          {/* Step 3 */}
          <div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-600 text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Download & Run</h4>
                <p className="text-gray-600 text-sm mt-2">
                  Save as `.dyn` and open in Dynamo. Ready to execute!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container max-w-7xl mx-auto px-4 py-16 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Dive into the comprehensive documentation to learn the API, architecture, and integration patterns.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/docs")}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            View Full Documentation <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="container max-w-7xl mx-auto px-4 py-8 text-center text-gray-600 text-sm">
          <p>© 2026 Dynamo Exporter. Built for AEC professionals.</p>
        </div>
      </footer>
    </div>
  );
}
