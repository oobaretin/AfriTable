import * as React from "react";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
  sections?: string[];
}

export function LegalPage({ title, lastUpdated, children, sections = [] }: LegalPageProps) {
  return (
    <div className="bg-slate-50 min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 border-b border-slate-200 pb-8 text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 mb-2">{title}</h1>
          <p className="text-sm text-slate-500 font-medium">Last Updated: {lastUpdated}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar Navigation - Sticky for long scrolls */}
          {sections.length > 0 && (
            <aside className="hidden lg:block lg:col-span-1 sticky top-8 h-fit">
              <nav className="space-y-4">
                <p className="text-xs font-black text-orange-600 uppercase tracking-widest">On this page</p>
                {sections.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="block text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </aside>
          )}

          {/* Content Area */}
          <div className={`${sections.length > 0 ? "lg:col-span-3" : "lg:col-span-4"} bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100`}>
            {/* "TL;DR" Highlight Box - Premium Touch */}
            <div className="mb-10 rounded-2xl bg-orange-50 border border-orange-100 p-6">
              <h4 className="flex items-center gap-2 text-orange-800 font-bold mb-2 uppercase text-xs tracking-wider">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                The Short Version
              </h4>
              <p className="text-sm text-orange-900/80 leading-relaxed">
                We respect your data and your time. By using AfriTable, you agree to respect our restaurant partners&apos; cancellation policies and keep your account info secure. We never sell your personal information.
              </p>
            </div>

            {/* Main Content Rendered Here */}
            <article className="prose prose-slate prose-orange max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-slate-600 prose-li:text-slate-600">
              {children}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
