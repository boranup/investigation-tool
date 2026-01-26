import './globals.css'
import type { Metadata } from 'next'

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
      <body>{children}</body>
    </html>
  )
}