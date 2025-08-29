export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <>
        <main className="flex items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, hsla(46, 100%, 50%, 1) 0%, hsla(46, 100%, 50%, 1) 0%, hsla(0, 0%, 100%, 1) 57%)' }}>{children}</main>
      </>
    );
  }
  