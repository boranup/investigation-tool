import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Investigation Tool',
  description: 'Incident Investigation Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <main className="flex-1">
          {children}
        </main>

        {/* ── Global Footer ── */}
        <footer className="bg-white border-t border-slate-200 mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

              {/* Reference statement */}
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                Designed in alignment with IOGP Reports 621, 552, 544, 517, 459, 415, 456, 638, 642, 452, 453, 510, 511
                and the IOGP Safety Data Reporting User Guide &bull; ISO 45001:2018 &bull; API RP 754 &bull; UK HSE HSG48 / HSG65 &bull;
                Energy Institute Learning from Incidents (2016) &bull; Norsk Industri — Safety, Leadership and Learning: HOP in Practice (2024) &bull; NOPSEMA Investigation Guidelines
              </p>

              {/* Standards page link */}
              <Link
                href="/standards"
                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap flex items-center gap-1 flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                Standards &amp; References
              </Link>

            </div>
          </div>
        </footer>

      </body>
    </html>
  )
}
