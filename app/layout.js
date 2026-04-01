export const metadata = {
  title: 'Project3 Team00',
  description: 'Legacy static site hosted through Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
