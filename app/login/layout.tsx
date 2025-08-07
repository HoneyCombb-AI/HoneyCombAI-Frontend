export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
    <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500">
      <main className="flex-1 flex flex-col w-full">{children}</main>
    </div>
    </>
  );
}
