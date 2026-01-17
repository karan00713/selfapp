import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3,
  BookOpen,
  Package
} from 'lucide-react';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      testId: 'nav-dashboard',
    },
    {
      name: 'Clients',
      icon: Users,
      path: '/clients',
      testId: 'nav-clients',
    },
    {
      name: 'Invoices',
      icon: FileText,
      path: '/invoices',
      testId: 'nav-invoices',
    },
    {
      name: 'HSN/SAC Codes',
      icon: BookOpen,
      path: '/hsn-codes',
      testId: 'nav-hsn-codes',
    },
    {
      name: 'Reports',
      icon: BarChart3,
      path: '/reports',
      testId: 'nav-reports',
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img 
            src="/company_logo.jpg" 
            alt="DeepByte Verxe" 
            className="w-10 h-10 object-contain rounded"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <h1 className="font-heading font-black text-xl tracking-tight text-primary">
              DeepByte Verxe
            </h1>
            <p className="text-xs text-slate-500">GST Billing</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <button
              key={item.path}
              data-testid={item.testId}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-400">DeepByte Verxe LLP</p>
        <p className="text-xs text-slate-400">v1.0.0</p>
      </div>
    </div>
  );
};
