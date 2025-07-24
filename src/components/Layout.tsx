
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <main className="ml-[15%] min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
