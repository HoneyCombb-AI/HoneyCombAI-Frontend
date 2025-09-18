import { SimpleHeader } from "@/components/SimpleHeader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SimpleHeader currentPage="login" />
      <main className="h-[calc(100vh-80px)] grid grid-cols-1 md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-amber-300 via-amber-200 to-yellow-100/90">
          <div className="max-w-lg flex-1 flex flex-col justify-center px-16">
            <h1 className="text-5xl font-black text-black leading-tight mb-6">
              Hello
              <br />
              <span className="text-amber-600">Honeycomb</span>
            </h1>
            <p className="text-lg font-semibold text-gray-800">
              Win Your Next Big Deal with Honeycomb's Real-Time Pipeline Signals & Smart Account Research
            </p>
          </div>
          <div className="flex justify-between items-center text-xs mt-6 px-4 py-4">
            <div className="font-semibold text-black">© 2025 Honeycomb AI</div>
            <div className="space-x-4">
              <a href="#" className="font-medium text-gray-700 underline">Terms of Service</a>
              <a href="#" className="font-medium text-gray-700 underline">Privacy Policy</a>
            </div>
          </div>
        </div>

        {/* RIGHT: white background with the actual form (children from page.tsx) */}
        <div className="bg-white flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
