import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { statsApi, membersApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Users, 
  Database, 
  FileCheck, 
  CreditCard, 
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileText,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStatusLabel, getStatusClass } from '../lib/utils';

function PromotorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsApi.get();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Miembros',
      value: stats?.total_members || 0,
      icon: Users,
      color: 'bg-link-blue',
      link: '/members',
    },
    {
      title: 'Incorporados',
      value: stats?.effective_members || 0,
      icon: CheckCircle,
      color: 'bg-verified-green',
      link: '/members',
    },
    {
      title: 'Pagos Pendientes',
      value: stats?.pending_payments || 0,
      icon: CreditCard,
      color: 'bg-compliance-amber',
      link: '/payments',
    },
    {
      title: 'Proveedores',
      value: stats?.total_providers || 0,
      icon: Database,
      color: 'bg-sky-500',
      link: '/members',
    },
    {
      title: 'Datasets Totales',
      value: stats?.total_datasets || 0,
      icon: Database,
      color: 'bg-indigo-500',
      link: '/datasets',
    },
    {
      title: 'Datasets Publicados',
      value: stats?.published_datasets || 0,
      icon: FileCheck,
      color: 'bg-emerald-500',
      link: '/datasets',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-bold text-slate-800">Dashboard Promotor</h1>
        <p className="text-slate-500 mt-1">Gestión del Espacio de Datos FENITEL</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <Card className="card-hover border-slate-200" data-testid={`stat-card-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="text-3xl font-outfit font-bold text-slate-800 mt-1">
                      {loading ? '-' : stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="font-outfit">Acciones Rápidas</CardTitle>
            <CardDescription>Gestión del espacio de datos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/members">
              <Button variant="outline" className="w-full justify-between" data-testid="quick-action-members">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Gestionar Miembros
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/payments">
              <Button variant="outline" className="w-full justify-between" data-testid="quick-action-payments">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Gestionar Pagos
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/datasets">
              <Button variant="outline" className="w-full justify-between" data-testid="quick-action-datasets">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Validar Datasets
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/governance">
              <Button variant="outline" className="w-full justify-between" data-testid="quick-action-governance">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Panel Gobernanza
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="font-outfit">Cumplimiento Orden 758/2025</CardTitle>
            <CardDescription>Estado del espacio de datos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">Registro de miembros</span>
                </div>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded">ACTIVO</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">Firma digital contratos</span>
                </div>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded">ACTIVO</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">Catálogo DCAT-AP</span>
                </div>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded">ACTIVO</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">Logs auditables</span>
                </div>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded">ACTIVO</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MemberDashboard() {
  const { user, refreshUser } = useAuth();

  const getStepStatus = (step) => {
    switch (step) {
      case 'contract':
        return user?.contract_signed ? 'completed' : 'pending';
      case 'payment':
        return user?.payment_status === 'paid' ? 'completed' : 
               user?.contract_signed ? 'pending' : 'locked';
      case 'identity':
        return user?.identity_evidence_id ? 'completed' :
               user?.payment_status === 'paid' ? 'pending' : 'locked';
      case 'effective':
        return user?.incorporation_status === 'effective' ? 'completed' : 'locked';
      default:
        return 'locked';
    }
  };

  const steps = [
    {
      key: 'contract',
      title: 'Firma del Contrato',
      description: 'Firma digital del contrato de adhesión',
      icon: FileText,
      link: '/my-contract',
    },
    {
      key: 'payment',
      title: 'Pago de Cuota',
      description: 'Cuota de incorporación al espacio',
      icon: CreditCard,
      link: '/my-contract',
    },
    {
      key: 'identity',
      title: 'Evidencia de Identidad',
      description: 'Generación por el promotor',
      icon: FileCheck,
      link: '/my-evidence',
    },
    {
      key: 'effective',
      title: 'Incorporación Efectiva',
      description: 'Acceso completo al espacio de datos',
      icon: CheckCircle,
      link: '/dashboard',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-bold text-slate-800">Mi Panel</h1>
        <p className="text-slate-500 mt-1">Bienvenido, {user?.name}</p>
      </div>

      {/* Status Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="font-outfit">Estado de Incorporación</CardTitle>
          <CardDescription>
            Progreso según Orden TDF/758/2025
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <span className={`status-badge ${getStatusClass(user?.incorporation_status)}`}>
              {getStatusLabel(user?.incorporation_status)}
            </span>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.key);
              return (
                <div 
                  key={step.key}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    status === 'completed' ? 'bg-emerald-50 border-emerald-200' :
                    status === 'pending' ? 'bg-amber-50 border-amber-200' :
                    'bg-slate-50 border-slate-200'
                  }`}
                  data-testid={`step-${step.key}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    status === 'completed' ? 'bg-emerald-500' :
                    status === 'pending' ? 'bg-amber-500' :
                    'bg-slate-300'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : status === 'pending' ? (
                      <Clock className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{step.title}</p>
                    <p className="text-sm text-slate-500">{step.description}</p>
                  </div>
                  {status === 'pending' && (
                    <Link to={step.link}>
                      <Button size="sm" className="bg-link-blue hover:bg-sky-700">
                        Completar
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions for Effective Members */}
      {user?.incorporation_status === 'effective' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-link-blue flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-outfit font-semibold">Mis Datasets</h3>
                  <p className="text-sm text-slate-500">Gestiona tus conjuntos de datos</p>
                </div>
                <Link to="/my-datasets">
                  <Button variant="outline" size="sm">
                    Ver <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-verified-green flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-outfit font-semibold">Mis Evidencias</h3>
                  <p className="text-sm text-slate-500">Descarga tus certificados</p>
                </div>
                <Link to="/my-evidence">
                  <Button variant="outline" size="sm">
                    Ver <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Provider notice */}
      {user?.is_provider && user?.incorporation_status === 'effective' && (
        <Card className="border-sky-200 bg-sky-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-sky-500 flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-outfit font-semibold text-sky-900">Eres Proveedor de Datos</h3>
                <p className="text-sm text-sky-700">Puedes subir datasets al catálogo del espacio de datos.</p>
              </div>
              <Link to="/my-datasets" className="ml-auto">
                <Button className="bg-sky-600 hover:bg-sky-700">
                  Subir Dataset
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { isPromotor } = useAuth();
  return isPromotor ? <PromotorDashboard /> : <MemberDashboard />;
}
