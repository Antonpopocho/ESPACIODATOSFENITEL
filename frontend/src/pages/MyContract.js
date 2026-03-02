import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { contractsApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Clock,
  Loader2,
  AlertTriangle,
  Pen
} from 'lucide-react';
import { formatDateTime, downloadBlob } from '../lib/utils';
import { toast } from 'sonner';

export default function MyContract() {
  const { user, refreshUser } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  const fetchContract = async () => {
    try {
      const response = await contractsApi.getMy();
      setContract(response.data);
    } catch (error) {
      console.error('Error fetching contract:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, []);

  const handleSign = async () => {
    setSigning(true);
    try {
      await contractsApi.sign();
      await fetchContract();
      await refreshUser();
      toast.success('Contrato firmado correctamente');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al firmar el contrato');
    } finally {
      setSigning(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await contractsApi.downloadPdf(contract.id);
      downloadBlob(response.data, `contrato_${contract.id}.pdf`);
    } catch (error) {
      toast.error('Error al descargar el contrato');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-outfit font-bold text-slate-800">Mi Contrato</h1>
        <p className="text-slate-500 mt-1">Contrato de adhesión al Espacio de Datos FENITEL</p>
      </div>

      {/* Status Alert */}
      {!user?.contract_signed && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Debes firmar el contrato de adhesión para continuar con el proceso de incorporación.
          </AlertDescription>
        </Alert>
      )}

      {user?.contract_signed && user?.payment_status !== 'paid' && (
        <Alert className="border-sky-200 bg-sky-50">
          <Clock className="h-4 w-4 text-sky-600" />
          <AlertDescription className="text-sky-800">
            Contrato firmado. Pendiente de confirmación de pago por parte de FENITEL.
          </AlertDescription>
        </Alert>
      )}

      {/* Contract Preview */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-outfit flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contrato de Adhesión
              </CardTitle>
              <CardDescription>Espacio de Datos Sectorial FENITEL</CardDescription>
            </div>
            {contract?.status === 'signed' && (
              <span className="status-badge status-signed">Firmado</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contract Content Preview */}
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <h3 className="font-outfit font-bold text-lg mb-4">CONTRATO DE ADHESIÓN</h3>
            <p className="text-sm text-slate-600 mb-4">
              Orden TDF/758/2025 - Kit Espacios de Datos
            </p>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold mb-1">PARTES</p>
                <p><strong>Promotor:</strong> FENITEL - Federación Nacional de Instaladores de Telecomunicaciones</p>
                <p><strong>Miembro:</strong> {user?.name} ({user?.nif})</p>
              </div>

              <div>
                <p className="font-semibold mb-1">CLÁUSULAS</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>El Miembro acepta las condiciones de participación en el Espacio de Datos.</li>
                  <li>El Miembro se compromete a cumplir con la normativa vigente.</li>
                  <li>El tratamiento de datos se realizará conforme al RGPD.</li>
                  <li>El Miembro acepta la gobernanza establecida por el Promotor.</li>
                  <li>Las cuotas de incorporación se establecen según tarifa vigente.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Signature Info */}
          {contract?.status === 'signed' && (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Contrato Firmado Digitalmente</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Fecha de firma</p>
                  <p className="font-medium">{formatDateTime(contract.signed_at)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Hash de firma (SHA-256)</p>
                  <p className="font-mono text-xs break-all">{contract.signature_hash}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {contract?.status !== 'signed' ? (
              <Button 
                className="flex-1 bg-link-blue hover:bg-sky-700"
                onClick={handleSign}
                disabled={signing}
                data-testid="sign-contract-button"
              >
                {signing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Firmando...
                  </>
                ) : (
                  <>
                    <Pen className="w-4 h-4 mr-2" />
                    Firmar Contrato
                  </>
                )}
              </Button>
            ) : (
              <Button 
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
                data-testid="download-contract-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="font-outfit">Estado del Pago</CardTitle>
          <CardDescription>Cuota de incorporación al espacio de datos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              {user?.payment_status === 'paid' ? (
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {user?.payment_status === 'paid' ? 'Pago Confirmado' : 'Pago Pendiente'}
                </p>
                <p className="text-sm text-slate-500">
                  {user?.payment_status === 'paid' 
                    ? 'Tu cuota de incorporación ha sido registrada'
                    : 'Contacta con FENITEL para realizar el pago'}
                </p>
              </div>
            </div>
            <span className={`status-badge ${user?.payment_status === 'paid' ? 'status-paid' : 'status-pending'}`}>
              {user?.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
