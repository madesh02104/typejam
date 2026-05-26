import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "TypeJam — Play Music by Typing",
  description:
    "A browser-based music creation studio. Play instruments with your keyboard, record takes, and arrange tracks.",
  metadataBase: new URL("https://typejam.netlify.app/"),
  openGraph: {
    title: "TypeJam — Play Music by Typing",
    description:
      "A browser-based music creation studio. Play instruments with your keyboard, record takes, and arrange tracks.",
    url: "/",
    siteName: "TypeJam",
    images: [
      {
        url: "/og/typejam-og.png",
        width: 1200,
        height: 630,
        alt: "TypeJam — Play Music by Typing",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TypeJam — Play Music by Typing",
    description:
      "A browser-based music creation studio. Play instruments with your keyboard, record takes, and arrange tracks.",
    images: ["/og/typejam-og.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
