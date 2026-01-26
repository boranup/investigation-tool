import Link from 'next/link'
import { ClipboardList, Database, Clock, GitBranch, Lightbulb } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Investigation Tool
          </h1>
          <p className="text-slate-600">
            Systematic incident investigation from data collection through recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/step1" className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Step 1: Investigation Initiation</h2>
            </div>
            <p className="text-sm text-slate-600">
              Create new investigation, capture incident details, assign team
            </p>
          </Link>

          <Link href="/step2" className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Step 2: Data Collection</h2>
            </div>
            <p className="text-sm text-slate-600">
              Gather evidence, conduct interviews, collect documentation
            </p>
          </Link>

          <Link href="/step3" className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Step 3: Timeline Construction</h2>
            </div>
            <p className="text-sm text-slate-600">
              Build chronological sequence of events
            </p>
          </Link>

          <Link href="/step4" className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GitBranch className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Step 4: Causal Analysis</h2>
            </div>
            <p className="text-sm text-slate-600">
              Identify causal factors, conduct HFAT/HOP analysis
            </p>
          </Link>

          <Link href="/step5" className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lightbulb className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Step 5: Recommendations</h2>
            </div>
            <p className="text-sm text-slate-600">
              Develop actionable recommendations based on validated causal factors
            </p>
          </Link>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">
            User Testing Version
          </h3>
          <p className="text-sm text-amber-800">
            This is a prototype for trusted user testing. All data is for demonstration purposes.
            Please provide feedback on workflow, usability, and missing features.
          </p>
        </div>
      </div>
    </div>
  )
}