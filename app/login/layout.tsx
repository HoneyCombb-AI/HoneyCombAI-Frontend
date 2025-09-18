import { SimpleHeader } from "@/components/SimpleHeader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SimpleHeader currentPage="login" />
      <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* LEFT: single-color marketing column (hidden on small screens) */}
        <div className="hidden md:flex flex-col justify-center px-16 py-24 bg-yellow-100">
          <div className="max-w-lg">
            <h1 className="text-5xl font-extrabold text-amber-700 leading-tight mb-6">
              Start selling to customers who already want to buy
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              Honeycomb AI gives your sales team the insights they need to know who to
              contact, what will resonate, and when to reach out — automatically.
            </p>
            <ul className="text-gray-700 list-disc list-inside space-y-2">
              <li>Real-time, actionable pipeline signals</li>
              <li>Smarter prospecting with account context</li>
              <li>Contacts dashboard with the context that matters</li>
            </ul>
          </div>
        </div>

        {/* RIGHT: white background with the actual form (children from page.tsx) */}
        <div className="bg-white flex items-center justify-center py-24 px-6">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
