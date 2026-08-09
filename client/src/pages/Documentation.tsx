import { useState } from "react";
import { docSections } from "@/lib/docs-data";
import {
  CodeBlock,
  DocTable,
  ContentRenderer,
  SectionCard,
  SubsectionNav,
} from "@/components/DocComponents";
import { Zap } from "lucide-react";

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("overview");
  const [activeSubsection, setActiveSubsection] = useState("what-is");

  const currentSection = docSections.find((s) => s.id === activeSection);
  const currentSubsection = currentSection?.subsections.find(
    (sub) => sub.id === activeSubsection
  );

  // Reset subsection when section changes
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    const section = docSections.find((s) => s.id === sectionId);
    if (section) {
      setActiveSubsection(section.subsections[0]?.id || "");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dynamo Exporter</h1>
              <p className="text-sm text-gray-600">Technical Reference Guide</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">
                Documentation
              </p>
              {docSections.map((section) => (
                <SectionCard
                  key={section.id}
                  title={section.title}
                  description={section.description}
                  icon={section.icon}
                  onClick={() => handleSectionChange(section.id)}
                  isActive={activeSection === section.id}
                />
              ))}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3 space-y-8">
            {currentSection && (
              <>
                {/* Section Header */}
                <div className="border-b-2 border-slate-200 pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{currentSection.icon}</span>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {currentSection.title}
                    </h2>
                  </div>
                  <p className="text-gray-600">{currentSection.description}</p>
                </div>

                {/* Subsection Navigation */}
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <SubsectionNav
                    subsections={currentSection.subsections}
                    activeId={activeSubsection}
                    onSelect={setActiveSubsection}
                  />
                </div>

                {/* Subsection Content */}
                {currentSubsection && (
                  <div className="bg-white rounded-lg border border-slate-200 p-8 space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {currentSubsection.title}
                    </h3>

                    {/* Content */}
                    <ContentRenderer content={currentSubsection.content} />

                    {/* Code Examples */}
                    {currentSubsection.code && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Example</h4>
                        <div className="space-y-4">
                          {currentSubsection.code.map((example, i) => (
                            <CodeBlock key={i} example={example} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Table */}
                    {currentSubsection.table && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Reference</h4>
                        <DocTable table={currentSubsection.table} />
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Hints */}
                <div className="grid grid-cols-2 gap-4">
                  {currentSection.subsections.length > 1 && (
                    <>
                      {currentSection.subsections.indexOf(
                        currentSubsection || currentSection.subsections[0]
                      ) > 0 && (
                        <button
                          onClick={() => {
                            const idx = currentSection.subsections.indexOf(
                              currentSubsection || currentSection.subsections[0]
                            );
                            setActiveSubsection(
                              currentSection.subsections[idx - 1].id
                            );
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-900 rounded-lg font-medium transition-colors"
                        >
                          ← Previous
                        </button>
                      )}
                      {currentSection.subsections.indexOf(
                        currentSubsection || currentSection.subsections[0]
                      ) <
                        currentSection.subsections.length - 1 && (
                        <button
                          onClick={() => {
                            const idx = currentSection.subsections.indexOf(
                              currentSubsection || currentSection.subsections[0]
                            );
                            setActiveSubsection(
                              currentSection.subsections[idx + 1].id
                            );
                          }}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors ml-auto"
                        >
                          Next →
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a
                    href="https://github.com/DynamoDS/Dynamo/issues/7747"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                  >
                    Dynamo JSON Schema Proposal
                  </a>
                </li>
                <li>
                  <a
                    href="https://developer.dynamobim.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                  >
                    Dynamo Developer Guide
                  </a>
                </li>
                <li>
                  <a
                    href="https://primer.dynamobim.org/07_Code-Block/7-1_what-is-a-code-block.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                  >
                    Dynamo Primer: Code Blocks
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">About</h4>
              <p className="text-sm text-gray-600">
                The Dynamo Exporter generates valid .dyn files using Code Block nodes as the primary building block.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Files</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>dynamo_exporter.py</li>
                <li>dynamo_exporter.js</li>
                <li>dynamogpt01.html</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-gray-600">
            <p>© 2026 Dynamo Exporter. Built for AEC professionals.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
