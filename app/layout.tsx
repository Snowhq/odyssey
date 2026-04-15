"use client";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import Providers from "./providers";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) {
      login();
    }
  }, [ready, authenticated]);

  if (!ready) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#5555ff" }} />
    </div>
  );

  if (!authenticated) return (
    <div style={{ minHeight: "100vh", background: "#000" }} />
  );

  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
  <head>
    <link rel="icon" href="/logo.png" />
  </head>
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>
          <AuthGate>
            {children}
          </AuthGate>
        </Providers>
      </body>
    </html>
  );
}