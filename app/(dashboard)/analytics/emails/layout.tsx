export default function EmailAnalyticsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-gray-50/50">
            {children}
        </div>
    );
}
