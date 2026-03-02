import React, { useState, useEffect } from 'react';
import { auditApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  ClipboardList, 
  Search, 
  Download,
  Loader2,
  Filter,
  User,
  FileText,
  Database,
  CreditCard,
  Shield,
  LogIn
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { formatDateTime, downloadBlob } from '../lib/utils';
import { toast } from 'sonner';

const actionIcons = {
  REGISTER: User,
  LOGIN: LogIn,
  SIGN_CONTRACT: FileText,
  UPDATE_PAYMENT: CreditCard,
  GENERATE_IDENTITY_EVIDENCE: Shield,
  UPLOAD_DATASET: Database,
  VALIDATE_DATASET: Database,
  PUBLISH_DATASET: Database,
  EXPORT_DOSSIER: Download,
  ADD_COMMITTEE_MEMBER: Shield,
  CREATE_DECISION: Shield,
};

const actionLabels = {
  REGISTER: 'Registro',
  LOGIN: 'Inicio sesión',
  SIGN_CONTRACT: 'Firma contrato',
  UPDATE_PAYMENT: 'Actualizar pago',
  GENERATE_IDENTITY_EVIDENCE: 'Generar evidencia identidad',
  UPLOAD_DATASET: 'Subir dataset',
  VALIDATE_DATASET: 'Validar dataset',
  PUBLISH_DATASET: 'Publicar dataset',
  EXPORT_DOSSIER: 'Exportar expediente',
  ADD_COMMITTEE_MEMBER: 'Añadir miembro comité',
  REMOVE_COMMITTEE_MEMBER: 'Eliminar miembro comité',
  CREATE_DECISION: 'Registrar decisión',
  TOGGLE_PROVIDER: 'Cambiar estado proveedor',
};

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await auditApi.list();
        setLogs(response.data);
      } catch (error) {
        toast.error('Error al cargar logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter;
    return matchesSearch && matchesResource;
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await auditApi.export();
      downloadBlob(response.data, 'audit_logs.csv');
      toast.success('Logs exportados');
    } catch (error) {
      toast.error('Error al exportar logs');
    } finally {
      setExporting(false);
    }
  };

  const resourceTypes = [...new Set(logs.map(l => l.resource_type))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-bold text-slate-800">Auditoría</h1>
          <p className="text-slate-500 mt-1">Registro completo de acciones del sistema</p>
        </div>
        <Button 
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          data-testid="export-audit-button"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por email o acción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="audit-search-input"
          />
        </div>
        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="audit-filter-select">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {resourceTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-outfit font-bold text-slate-800">{logs.length}</p>
            <p className="text-sm text-slate-500">Total registros</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-outfit font-bold text-slate-800">
              {logs.filter(l => l.action === 'LOGIN').length}
            </p>
            <p className="text-sm text-slate-500">Inicios sesión</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-outfit font-bold text-slate-800">
              {logs.filter(l => l.resource_type === 'dataset').length}
            </p>
            <p className="text-sm text-slate-500">Acciones datasets</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-outfit font-bold text-slate-800">
              {logs.filter(l => l.resource_type === 'evidence').length}
            </p>
            <p className="text-sm text-slate-500">Evidencias</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <ClipboardList className="w-12 h-12 mb-4 text-slate-300" />
              <p>No se encontraron registros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Recurso</th>
                    <th>IP</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const Icon = actionIcons[log.action] || ClipboardList;
                    return (
                      <tr key={log.id} data-testid={`audit-row-${log.id}`}>
                        <td className="whitespace-nowrap">
                          <span className="font-mono text-xs">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm">{log.user_email}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium">
                              {actionLabels[log.action] || log.action}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                            {log.resource_type}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-xs text-slate-500">
                            {log.ip_address}
                          </span>
                        </td>
                        <td>
                          {Object.keys(log.details).length > 0 ? (
                            <span className="text-xs text-slate-500 max-w-xs truncate block">
                              {JSON.stringify(log.details)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-sky-200 bg-sky-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-sky-600 mt-0.5" />
            <div className="text-sm text-sky-800">
              <p className="font-medium">Trazabilidad según Orden 758/2025</p>
              <p className="mt-1">
                Todos los registros son inmutables y contienen información completa: usuario, fecha, 
                IP, acción y recurso afectado. Estos logs son esenciales para la auditoría de subvenciones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
