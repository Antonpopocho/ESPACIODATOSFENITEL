import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { evidenceApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  FileCheck, 
  Download, 
  Loader2,
  Shield,
  Database,
  Clock
} from 'lucide-react';
import { formatDateTime, downloadBlob } from '../lib/utils';
import { toast } from 'sonner';

export default function MyEvidence() {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const response = await evidenceApi.getUserEvidence(user.id);
        setEvidence(response.data);
      } catch (error) {
        console.error('Error fetching evidence:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, [user.id]);

  const handleDownload = async (ev) => {
    try {
      const response = await evidenceApi.downloadPdf(ev.id);
      downloadBlob(response.data, `evidencia_${ev.evidence_type}_${ev.id}.pdf`);
    } catch (error) {
      toast.error('Error al descargar evidencia');
    }
  };

  const getEvidenceIcon = (type) => {
    switch (type) {
      case 'identity':
        return Shield;
      case 'publication':
        return Database;
      default:
        return FileCheck;
    }
  };

  const getEvidenceTitle = (type) => {
    switch (type) {
      case 'identity':
        return 'Evidencia de Identidad';
      case 'publication':
        return 'Evidencia de Publicación';
      default:
        return 'Evidencia';
    }
  };

  const getEvidenceDescription = (type) => {
    switch (type) {
      case 'identity':
        return 'Certificado de incorporación al Espacio de Datos';
      case 'publication':
        return 'Certificado de publicación de dataset en el catálogo';
      default:
        return 'Certificado digital firmado';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-outfit font-bold text-slate-800">Mis Evidencias</h1>
        <p className="text-slate-500 mt-1">Certificados digitales según Orden TDF/758/2025</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
        </div>
      ) : evidence.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-12">
            <div className="text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-medium text-slate-800 mb-2">Sin evidencias aún</h3>
              <p className="text-sm text-slate-500">
                Las evidencias serán generadas por FENITEL tras completar los requisitos.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {evidence.map((ev) => {
            const Icon = getEvidenceIcon(ev.evidence_type);
            return (
              <Card key={ev.id} className="border-slate-200" data-testid={`evidence-card-${ev.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-verified-green flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-outfit font-semibold text-lg text-slate-800">
                            {getEvidenceTitle(ev.evidence_type)}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {getEvidenceDescription(ev.evidence_type)}
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => handleDownload(ev)}
                          data-testid={`download-evidence-${ev.id}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar PDF
                        </Button>
                      </div>

                      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">ID Evidencia</p>
                            <p className="font-mono text-xs break-all">{ev.id}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Fecha de generación</p>
                            <p className="font-medium">{formatDateTime(ev.timestamp)}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-slate-500">Hash de firma (SHA-256)</p>
                            <p className="font-mono text-xs break-all">{ev.hash}</p>
                          </div>
                        </div>
                      </div>

                      {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-slate-500 mb-2">Metadatos adicionales:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(ev.metadata).map(([key, value]) => (
                              <span key={key} className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-sky-200 bg-sky-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-sky-600 mt-0.5" />
            <div className="text-sm text-sky-800">
              <p className="font-medium">Sobre las evidencias</p>
              <p className="mt-1">
                Las evidencias son documentos PDF firmados digitalmente que certifican tu participación 
                en el Espacio de Datos FENITEL conforme a la Orden TDF/758/2025.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
