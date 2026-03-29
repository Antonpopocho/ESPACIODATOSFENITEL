import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Database, 
  Building2, 
  FileCheck, 
  Shield, 
  Users, 
  BarChart3,
  Download,
  ArrowRight,
  CheckCircle,
  FileText,
  Scale
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function LandingPage() {
  const [stats, setStats] = useState({ empresas_asociadas: 0, datasets_publicados: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/stats/public`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  const benefits = [
    {
      icon: BarChart3,
      title: 'Acceso a datos sectoriales',
      description: 'Consulta y comparte datos del sector de telecomunicaciones con otros asociados de FENITEL.'
    },
    {
      icon: Shield,
      title: 'Cumplimiento normativo',
      description: 'Plataforma conforme a la Orden TDF/758/2025 del Kit de Espacios de Datos.'
    },
    {
      icon: FileCheck,
      title: 'Evidencias certificadas',
      description: 'Generación automática de evidencias firmadas digitalmente para trazabilidad completa.'
    },
    {
      icon: Users,
      title: 'Red de profesionales',
      description: 'Conecta con otros instaladores de telecomunicaciones y comparte conocimiento sectorial.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-telecom-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-link-blue flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-outfit font-bold text-xl">FENITEL</h1>
                <p className="text-slate-400 text-xs">Espacio de Datos Sectorial</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-slate-800">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-link-blue hover:bg-sky-700">
                  Solicitar Adhesión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-telecom-navy text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-outfit text-4xl lg:text-5xl font-bold mb-6">
              Espacio de Datos del Sector Telecomunicaciones
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Comparte y accede a datos sectoriales de forma segura. 
              Plataforma exclusiva para asociados de FENITEL.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-link-blue hover:bg-sky-700 text-lg px-8">
                  Registrar mi empresa
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#beneficios">
                <Button size="lg" variant="outline" className="text-lg px-8 border-slate-400 text-white hover:bg-slate-800">
                  Saber más
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="w-8 h-8 text-link-blue" />
              </div>
              <p className="text-4xl lg:text-5xl font-outfit font-bold text-telecom-navy">
                {stats.empresas_asociadas}
              </p>
              <p className="text-slate-600 mt-1">Empresas asociadas</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="w-8 h-8 text-link-blue" />
              </div>
              <p className="text-4xl lg:text-5xl font-outfit font-bold text-telecom-navy">
                {stats.datasets_publicados}
              </p>
              <p className="text-slate-600 mt-1">Datasets publicados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="font-outfit text-3xl font-bold text-telecom-navy mb-4">
              Beneficios de participar
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Únete al espacio de datos sectorial de FENITEL y aprovecha todas las ventajas 
              de compartir información con otros profesionales del sector.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-link-blue/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-link-blue" />
                  </div>
                  <h4 className="font-outfit font-semibold text-lg text-telecom-navy mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-slate-600 text-sm">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="font-outfit text-3xl font-bold text-telecom-navy mb-4">
              Conforme a la normativa
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Este espacio de datos cumple con los requisitos establecidos en la 
              normativa española y europea para espacios de datos sectoriales.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6 text-center">
                <Scale className="w-10 h-10 text-link-blue mx-auto mb-3" />
                <h4 className="font-outfit font-semibold text-telecom-navy mb-2">
                  UNE 0087:2025
                </h4>
                <p className="text-sm text-slate-600">
                  Definici&oacute;n y caracterizaci&oacute;n de Espacios de Datos
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6 text-center">
                <Scale className="w-10 h-10 text-link-blue mx-auto mb-3" />
                <h4 className="font-outfit font-semibold text-telecom-navy mb-2">
                  Orden TDF/758/2025
                </h4>
                <p className="text-sm text-slate-600">
                  Lista de Confianza de Espacios de Datos
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6 text-center">
                <Shield className="w-10 h-10 text-link-blue mx-auto mb-3" />
                <h4 className="font-outfit font-semibold text-telecom-navy mb-2">
                  Datos protegidos
                </h4>
                <p className="text-sm text-slate-600">
                  Acceso exclusivo asociados FENITEL
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-10 h-10 text-link-blue mx-auto mb-3" />
                <h4 className="font-outfit font-semibold text-telecom-navy mb-2">
                  Evidencias firmadas
                </h4>
                <p className="text-sm text-slate-600">
                  Trazabilidad completa DCAT-AP
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="font-outfit text-3xl font-bold text-telecom-navy mb-4">
              Documentación
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Consulta los documentos oficiales del espacio de datos.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="/docs/Gobernanza_Espacio_Datos_FENITEL.docx" 
              download
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <FileText className="w-5 h-5 text-link-blue" />
              <span className="font-medium text-telecom-navy">Modelo de Gobernanza</span>
              <Download className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="/docs/contrato-adhesion.pdf" 
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <FileText className="w-5 h-5 text-link-blue" />
              <span className="font-medium text-telecom-navy">Contrato de Adhesión</span>
              <Download className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="/docs/01_Diseno_Modelo_Gobernanza.docx" 
              download
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <FileText className="w-5 h-5 text-link-blue" />
              <span className="font-medium text-telecom-navy">Diseño del Modelo</span>
              <Download className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-telecom-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="font-outfit text-3xl font-bold mb-4">
            ¿Eres asociado de FENITEL?
          </h3>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Únete al espacio de datos sectorial y comienza a compartir información 
            con otros profesionales del sector de telecomunicaciones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-link-blue hover:bg-sky-700 text-lg px-8">
                Solicitar Adhesión
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 border-slate-400 text-white hover:bg-slate-800">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-link-blue flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <span className="font-outfit font-semibold text-white">FENITEL</span>
            </div>
            <p className="text-sm">
              Espacio de Datos conforme a Orden TDF/758/2025 - Kit Espacios de Datos
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
