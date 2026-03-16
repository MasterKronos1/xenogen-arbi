import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'ARBI — XenoGenesis Intelligence',
  description: 'Your guide through the XenoGenesis pathway.',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#06100a', height: '100vh', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
