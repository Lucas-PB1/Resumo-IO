import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-muted/30 p-4">
      {children}
    </div>
  );
}
