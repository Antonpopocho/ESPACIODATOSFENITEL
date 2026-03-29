import React, { useState, useEffect } from 'react';
import { complianceApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Shield, 
  Download, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Database,
  FileCheck,
  Scale
} from 'lucide-react';
import { toast } from 'sonner';

export default function Compliance() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await complianceApi.getReport();
        setReport(response.data);
      } catch (error) {
        console.error('Error fetching compliance report:', error);
        toast.error('Error al cargar informe de cumplimiento');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await complianceApi.downloadReportPdf();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'informe_cumplimiento_UNE_0087.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Informe descargado');
    } catch (error) {
      toast.error('Error al descargar informe');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-slate-600">No se pudo cargar el informe de cumplimiento</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-outfit font-bold text-telecom-navy">
            Cumplimiento UNE 0087:2025
          </h1>
          <p className="text-slate-600">
            Verificación de conformidad del Espacio de Datos
          </p>
        </div>
        <Button onClick={handleDownload} disabled={downloading}>
          {downloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Descargar Informe PDF
        </Button>
      </div>

      {/* Overall Status */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800">
                  {report.overall_compliance}
                </h2>
                <p className="text-green-700">
                  Conforme a UNE 0087:2025 y Orden TDF/758/2025
                </p>
              </div>
            </div>
            <Badge className="bg-green-600 text-white text-lg px-4 py-2">
              VERIFICADO
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Business Model */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-link-blue" />
              <CardTitle className="text-lg">Modelo de Negocio</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className={report.business_model.status === 'CUMPLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {report.business_model.status}
            </Badge>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Participantes</span>
                <span className="font-medium">{report.business_model.participants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Activos</span>
                <span className="font-medium">{report.business_model.active_participants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Sostenibilidad</span>
                <span className="font-medium">{report.business_model.sustainability}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Governance */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-link-blue" />
              <CardTitle className="text-lg">Sistema de Gobernanza</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className={report.governance.status === 'CUMPLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {report.governance.status}
            </Badge>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Miembros comité</span>
                <span className="font-medium">{report.governance.committee_members}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Decisiones</span>
                <span className="font-medium">{report.governance.decisions_recorded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Incidencias</span>
                <span className="font-medium">{report.governance.incidents_total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tasa resolución</span>
                <span className="font-medium text-green-600">{report.governance.incident_resolution_rate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Solution */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-link-blue" />
              <CardTitle className="text-lg">Solución Técnica</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className={report.technical_solution.status === 'CUMPLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {report.technical_solution.status}
            </Badge>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Arquitectura</span>
                <span className="font-medium text-xs">{report.technical_solution.architecture}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Catálogo</span>
                <span className="font-medium">{report.technical_solution.catalog_standard}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Datasets publicados</span>
                <span className="font-medium">{report.technical_solution.datasets_published}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Evidencias</span>
                <span className="font-medium">{report.technical_solution.evidences_generated}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interoperability */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-link-blue" />
              <CardTitle className="text-lg">Interoperabilidad</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className={report.interoperability.status === 'CUMPLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {report.interoperability.status}
            </Badge>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Estándar API</span>
                <span className="font-medium">{report.interoperability.api_standard}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Formato catálogo</span>
                <span className="font-medium">{report.interoperability.catalog_format}</span>
              </div>
              <div>
                <span className="text-slate-600">Categorías sectoriales</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.interoperability.categories.map((cat) => (
                    <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit & Traceability */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-link-blue" />
              <CardTitle className="text-lg">Auditoría y Trazabilidad</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className={report.audit_traceability.status === 'CUMPLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {report.audit_traceability.status}
            </Badge>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Registros auditoría</span>
                <span className="font-medium">{report.audit_traceability.total_audit_records}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Evidencias con hash</span>
                <span className="font-medium">{report.audit_traceability.evidences_with_hash}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Información del Informe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">ID Informe</span>
                <span className="font-mono text-xs">{report.report_id?.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Generado</span>
                <span className="font-medium">{report.generated_at?.substring(0, 10)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Espacio de datos</span>
                <span className="font-medium">{report.data_space?.name?.substring(0, 20)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Normativa</span>
                <span className="font-medium text-xs">{report.data_space?.normative?.substring(0, 25)}...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Normative References */}
      <Card>
        <CardHeader>
          <CardTitle>Referencias Normativas</CardTitle>
          <CardDescription>
            Este espacio de datos cumple con las siguientes normativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-telecom-navy">UNE 0087:2025</h4>
              <p className="text-sm text-slate-600 mt-1">
                Definición y caracterización de los Espacios de Datos
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-telecom-navy">Orden TDF/758/2025</h4>
              <p className="text-sm text-slate-600 mt-1">
                Lista de Confianza de Espacios de Datos
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-telecom-navy">BOE-A-2025-24440</h4>
              <p className="text-sm text-slate-600 mt-1">
                Resolución de criterios de evaluación
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
