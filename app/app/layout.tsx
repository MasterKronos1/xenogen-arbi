import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARBI — XenoGenesis",
  description: "Artificial Biological & Reconnaissance Intelligence — XenoGenesis Ecosystem Guide",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#040a0f" }}>
        {children}
      </body>
    </html>
  );
}
