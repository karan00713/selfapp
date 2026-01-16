import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3,
  LogOut
} from 'lucide-react';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        <h1 className="font-heading font-black text-2xl tracking-tight text-primary">
          DeepByte Verxe
        </h1>
        <p className="text-xs text-slate-500 mt-1">GST Billing</p>
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

      {/* Logout */}
      <div className="p-4 border-t border-slate-200">
        <Button
          data-testid="logout-button"
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};
