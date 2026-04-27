import Script from 'next/script';

export const metadata = {
  title: 'Project3 Team00',
  description: 'Legacy static site hosted through Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script id="apply-contrast-theme" strategy="beforeInteractive">
          {`
            (function() {
              try {
                if (localStorage.getItem('highContrast') === 'true') {
                  document.documentElement.setAttribute('data-theme', 'high-contrast');
                }
              } catch (e) {}
            })();
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
