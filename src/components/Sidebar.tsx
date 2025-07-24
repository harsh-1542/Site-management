
import { Home, Building2, Package, ShoppingCart, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { name: 'Dashboard', icon: Home, path: '/' },
  { name: 'Sites', icon: Building2, path: '/sites' },
  { name: 'Inventory', icon: Package, path: '/inventory' },
  { name: 'Purchase Summary', icon: ShoppingCart, path: '/purchase-summary' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-[15%] min-w-[200px] bg-gradient-to-b from-slate-900 to-slate-800 text-white h-screen fixed left-0 top-0 shadow-xl">
      <div className="p-6 border-b border-slate-700">
        
         <Link to="/" className="  rounded-tl-3xl rounded-br-3xl px-6 sm:px-14 py-2 sm:py-3 ml-[-16px] sm:ml-[-24px]">
                <img src="/images/site-logo.png" alt="Furnisure Logo" className="h-10 sm:h-14 w-auto rounded-2xl" />
              </Link>
        
        
      </div>
      
      <nav className="mt-6">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-700/50 border-r-2 border-transparent",
                isActive && "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-400 text-blue-300"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
