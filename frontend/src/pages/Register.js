import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Database, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    nif: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        organization: formData.organization,
        nif: formData.nif,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
        role: 'miembro',
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-slate-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-outfit font-bold text-slate-800 mb-2">
                Solicitud Enviada
              </h2>
              <p className="text-slate-600 mb-4">
                Tu solicitud de adhesión ha sido registrada. Serás redirigido al login en unos segundos.
              </p>
              <p className="text-sm text-slate-500">
                Próximos pasos: Firma del contrato y pago de cuota de incorporación.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-telecom-navy flex items-center justify-center">
            <Database className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-telecom-navy font-outfit font-bold text-2xl">FENITEL</h1>
            <p className="text-slate-500 text-sm">Espacio de Datos Sectorial</p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-outfit">Solicitud de Adhesión</CardTitle>
            <CardDescription>
              Completa el formulario para solicitar la incorporación al Espacio de Datos FENITEL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" data-testid="register-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre / Razón Social *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Empresa S.L."
                    value={formData.name}
                    onChange={handleChange}
                    required
                    data-testid="register-name-input"
                    className="border-slate-300 focus:border-link-blue focus:ring-link-blue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nif">NIF/CIF *</Label>
                  <Input
                    id="nif"
                    name="nif"
                    placeholder="B12345678"
                    value={formData.nif}
                    onChange={handleChange}
                    required
                    data-testid="register-nif-input"
                    className="border-slate-300 focus:border-link-blue focus:ring-link-blue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organización *</Label>
                  <Input
                    id="organization"
                    name="organization"
                    placeholder="Nombre de la organización"
                    value={formData.organization}
                    onChange={handleChange}
                    required
                    data-testid="register-organization-input"
                    className="border-slate-300 focus:border-link-blue focus:ring-link-blue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    data-testid="register-email-input"
                    className="border-slate-300 focus:border-link-blue focus:ring-link-blue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+34 600 000 000"
                    value={formData.phone}
                    onChange={handleChange}
                    data-testid="register-phone-input"
                    className="border-slate-300 focus:border-link-blue focus:ring-link-blue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Calle, número, ciudad"
                    value={formData.address}
                    onChange={handleChange}
                    data-testid="register-address-input"
                    className="border-slate-300 focus:border-link-blue focus:ring-link-blue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    data-testid="register-password-input"
                    className="border-slate-300 focus:border-link-blue focus:ring-link-blue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repite la contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    data-testid="register-confirm-password-input"
                    className="border-slate-300 focus:border-link-blue focus:ring-link-blue"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
                <p className="font-medium mb-2">Información importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Al registrarte aceptas las condiciones del Espacio de Datos FENITEL</li>
                  <li>La incorporación efectiva requiere firma de contrato y pago de cuota</li>
                  <li>Cumplimiento según Orden TDF/758/2025</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-link-blue hover:bg-sky-700"
                disabled={loading}
                data-testid="register-submit-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando solicitud...
                  </>
                ) : (
                  'Enviar Solicitud de Adhesión'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-500">¿Ya tienes cuenta? </span>
              <Link 
                to="/login" 
                className="text-link-blue hover:underline font-medium"
                data-testid="login-link"
              >
                Iniciar sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
