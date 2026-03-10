export default function SupportLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-80px)] bg-linear-to-br from-gray-50 to-gray-100">
            <div className="w-full max-w-md bg-white p-8 py-12 rounded-lg shadow-lg border border-gray-200">
                {children}
            </div>
        </main>
    );
}
