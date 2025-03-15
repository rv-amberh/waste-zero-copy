import "./globals.css"; // Ensure this points to your global CSS file
// import { AuthProvider } from "./useAuth"; // Import your AuthProvider


export const metadata = {
  title: 'Waste Zero',
  description: 'Food Waste Genie',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="min-w-screen min-h-screen">
      <body className="min-w-screen  min-h-screen bg-[#fdfefb]">
      {/* <AuthProvider> */}
        {children}
        {/* </AuthProvider> */}
        </body>
    </html>
  )
}
