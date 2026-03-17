import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ARBI — XenoGenesis',
  description: 'Artificial Biological & Reconnaissance Intelligence. Your guide through the XenoGenesis pathway.',
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
