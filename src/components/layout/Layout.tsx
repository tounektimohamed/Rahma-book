import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F2] text-[#443B3B]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
