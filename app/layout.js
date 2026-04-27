export const metadata = {
  title: 'Project3 Team00',
  description: 'Legacy static site hosted through Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* applies saved high contrast preference before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              if (localStorage.getItem('highContrast') === 'true') {
                document.documentElement.setAttribute('data-theme', 'high-contrast');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
