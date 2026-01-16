import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await register(name, email, password);
        toast.success('Account created successfully!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Branding */}
          <div>
            <h1 className="font-heading font-black text-4xl tracking-tight text-primary">
              DeepByte Verxe
            </h1>
            <p className="mt-2 text-slate-500 text-sm">GST Billing Software</p>
          </div>

          {/* Form */}
          <div className="mt-12">
            <h2 className="font-heading font-bold text-2xl tracking-tight text-primary mb-2">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="text-sm text-slate-500 mb-8">
              {isLogin ? 'Welcome back! Please enter your details.' : 'Get started with your GST billing'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-900">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    data-testid="register-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-900">
                  Email
                </Label>
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  placeholder="you@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-900">
                  Password
                </Label>
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                data-testid="login-submit-button"
                disabled={loading}
                className="w-full h-11 font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    {isLogin ? 'Sign in' : 'Create account'}
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                data-testid="toggle-auth-mode-button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-accent hover:underline font-medium"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1666618207644-4de0226a3f85?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwb2ZmaWNlJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc2ODU3NjIzMnww&ixlib=rb-4.1.0&q=85"
            alt="Modern office"
            className="w-full h-full object-cover opacity-50 grayscale"
          />
        </div>
        <div className="relative z-10 flex items-center justify-center h-full p-12">
          <div className="max-w-md">
            <h3 className="font-heading font-bold text-3xl text-white mb-4">
              Professional GST Billing
            </h3>
            <p className="text-slate-300 text-lg leading-relaxed">
              Manage your invoices, clients, and GST compliance with ease. Built for Indian businesses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
