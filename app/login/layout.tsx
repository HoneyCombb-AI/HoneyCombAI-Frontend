export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
        <main className="flex-1 flex flex-col w-full">{children}</main>
      </div>
    </>
  );
}
