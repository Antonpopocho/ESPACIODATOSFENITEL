import React, { useState } from 'react';
import { docsApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  FileText, 
  Download, 
  Loader2,
  BookOpen,
  ClipboardCheck,
  Shield,
  CheckCircle,
  FileCheck,
  GitBranch
} from 'lucide-react';
import { downloadBlob } from '../lib/utils';
import { toast } from 'sonner';

const documents = [
  {
    id: 'manual-despliegue',
    title: 'Manual de Despliegue',
    description: 'Guía completa para desplegar el Espacio de Datos en producción. Incluye requisitos, configuración y pasos de instalación.',
    icon: BookOpen,
    color: 'bg-link-blue',
    downloadFn: docsApi.downloadManualDespliegue,
    filename: 'manual_despliegue_fenitel.pdf',
  },
  {
    id: 'checklist-758',
    title: 'Checklist Orden 758/2025',
    description: 'Lista de verificación de cumplimiento con la Orden TDF/758/2025. Estado actual: 94% completado.',
    icon: ClipboardCheck,
    color: 'bg-verified-green',
    downloadFn: docsApi.downloadChecklist,
    filename: 'checklist_orden_758_2025.pdf',
  },
  {
    id: 'manual-auditoria',
    title: 'Manual de Auditoría',
    description: 'Procedimientos de auditoría, tipos de registros, verificación de evidencias y política de retención.',
    icon: Shield,
    color: 'bg-compliance-amber',
    downloadFn: docsApi.downloadManualAuditoria,
    filename: 'manual_auditoria_fenitel.pdf',
  },
  {
    id: 'informe-evidencias',
    title: 'Informe Auditoría Evidencias',
    description: 'Informe completo de verificación del sistema de generación de evidencias conforme a Orden 758/2025.',
    icon: FileCheck,
    color: 'bg-indigo-500',
    downloadFn: docsApi.downloadInformeEvidencias,
    filename: 'informe_auditoria_evidencias.pdf',
  },
  {
    id: 'diagrama-flujo',
    title: 'Diagrama de Flujo',
    description: 'Diagrama del flujo de generación de evidencias: registro de miembros y publicación de datasets.',
    icon: GitBranch,
    color: 'bg-purple-500',
    downloadFn: docsApi.downloadDiagramaFlujo,
    filename: 'diagrama_flujo_evidencias.pdf',
  },
];

export default function Documentation() {
  const [downloading, setDownloading] = useState({});

  const handleDownload = async (doc) => {
    setDownloading({ ...downloading, [doc.id]: true });
    try {
      const response = await doc.downloadFn();
      downloadBlob(response.data, doc.filename);
      toast.success(`${doc.title} descargado`);
    } catch (error) {
      toast.error(`Error al descargar ${doc.title}`);
    } finally {
      setDownloading({ ...downloading, [doc.id]: false });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-outfit font-bold text-slate-800">Documentación</h1>
        <p className="text-slate-500 mt-1">Manuales y documentos del Espacio de Datos FENITEL</p>
      </div>

      {/* Info Card */}
      <Card className="border-sky-200 bg-sky-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-sky-600 mt-0.5" />
            <div className="text-sm text-sky-800">
              <p className="font-medium">Documentación según Orden TDF/758/2025</p>
              <p className="mt-1">
                Estos documentos son generados automáticamente y reflejan el estado actual del sistema.
                Descárgalos en PDF para incluirlos en tu expediente de solicitud de ayuda.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <Card key={doc.id} className="border-slate-200 card-hover" data-testid={`doc-card-${doc.id}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg ${doc.color} flex items-center justify-center flex-shrink-0`}>
                  <doc.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-outfit font-semibold text-lg text-slate-800 mb-1">
                    {doc.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {doc.description}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownload(doc)}
                    disabled={downloading[doc.id]}
                    data-testid={`download-${doc.id}`}
                  >
                    {downloading[doc.id] ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="font-outfit text-lg">Contenido de los documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-link-blue" />
                Manual de Despliegue
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Requisitos del sistema</li>
                <li>• Estructura del proyecto</li>
                <li>• Variables de entorno</li>
                <li>• Docker Compose</li>
                <li>• Backup y restauración</li>
                <li>• Configuración de seguridad</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-verified-green" />
                Checklist 758/2025
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Registro y adhesión</li>
                <li>• Cuotas e incorporación</li>
                <li>• Evidencias digitales</li>
                <li>• Catálogo DCAT-AP</li>
                <li>• Gobernanza</li>
                <li>• Auditoría y trazabilidad</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-compliance-amber" />
                Manual de Auditoría
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Tipos de registros</li>
                <li>• Campos de auditoría</li>
                <li>• Procedimientos</li>
                <li>• Verificación de evidencias</li>
                <li>• Exportación de logs</li>
                <li>• Política de retención</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
