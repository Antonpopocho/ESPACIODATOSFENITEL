import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Database, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-telecom-navy">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1541415534056-fad380cd68a5?crop=entropy&cs=srgb&fm=jpg&q=85)' }}
        />
        <div className="relative z-10 flex flex-col justify-center px-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-link-blue flex items-center justify-center">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white font-outfit font-bold text-2xl">FENITEL</h1>
              <p className="text-slate-400 text-sm">Espacio de Datos Sectorial</p>
            </div>
          </div>
          <h2 className="text-4xl lg:text-5xl font-outfit font-bold text-white leading-tight mb-6">
            Plataforma de Datos<br />para el Sector<br />Telecomunicaciones
          </h2>
          <p className="text-slate-300 text-lg max-w-md">
            Cumplimiento Orden TDF/758/2025. Gestión segura de datos sectoriales con trazabilidad completa.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-telecom-navy flex items-center justify-center">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-telecom-navy font-outfit font-bold text-2xl">FENITEL</h1>
              <p className="text-slate-500 text-sm">Espacio de Datos</p>
            </div>
          </div>

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-outfit">Iniciar Sesión</CardTitle>
              <CardDescription>
                Accede a tu espacio de datos FENITEL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" data-testid="login-error">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="login-email-input"
                    className="border-slate-300 focus:border-link-blue focus:ring-link-blue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="login-password-input"
                    className="border-slate-300 focus:border-link-blue focus:ring-link-blue"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-link-blue hover:bg-sky-700"
                  disabled={loading}
                  data-testid="login-submit-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-slate-500">¿No tienes cuenta? </span>
                <Link 
                  to="/register" 
                  className="text-link-blue hover:underline font-medium"
                  data-testid="register-link"
                >
                  Solicitar adhesión
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-slate-500">
            Orden TDF/758/2025 - Kit Espacios de Datos
          </p>
        </div>
      </div>
    </div>
  );
}
