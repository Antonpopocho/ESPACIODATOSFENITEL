import React, { useState, useEffect } from 'react';
import { membersApi, paymentsApi, evidenceApi, exportApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { 
  Users, 
  Search, 
  MoreVertical, 
  FileCheck, 
  Download, 
  UserCheck,
  Building,
  Mail,
  Phone,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Award
} from 'lucide-react';
import { formatDate, getStatusLabel, getStatusClass, downloadBlob } from '../lib/utils';
import { toast } from 'sonner';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      const response = await membersApi.list();
      setMembers(response.data);
    } catch (error) {
      toast.error('Error al cargar miembros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.nif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleProvider = async (memberId) => {
    setActionLoading(true);
    try {
      await membersApi.toggleProvider(memberId);
      await fetchMembers();
      toast.success('Estado de proveedor actualizado');
    } catch (error) {
      toast.error('Error al actualizar estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateIdentity = async (memberId) => {
    setActionLoading(true);
    try {
      await evidenceApi.generateIdentity(memberId);
      await fetchMembers();
      toast.success('Evidencia de identidad generada');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al generar evidencia');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportDossier = async (memberId, memberNif) => {
    setActionLoading(true);
    try {
      const response = await exportApi.memberDossier(memberId);
      downloadBlob(response.data, `expediente_${memberNif}.zip`);
      toast.success('Expediente descargado');
    } catch (error) {
      toast.error('Error al exportar expediente');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadRegistrationCertificate = async (memberId, memberNif) => {
    setActionLoading(true);
    try {
      const response = await membersApi.downloadRegistrationCertificate(memberId);
      downloadBlob(response.data, `certificado_registro_${memberNif}.pdf`);
      toast.success('Certificado de registro descargado');
    } catch (error) {
      toast.error('Error al descargar certificado');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetails = (member) => {
    setSelectedMember(member);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-bold text-slate-800">Miembros</h1>
          <p className="text-slate-500 mt-1">Gestión de miembros del Espacio de Datos</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar miembros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="member-search-input"
          />
        </div>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Users className="w-12 h-12 mb-4 text-slate-300" />
              <p>No se encontraron miembros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Miembro</th>
                    <th>NIF</th>
                    <th>Estado</th>
                    <th>Pago</th>
                    <th>Proveedor</th>
                    <th>Fecha Registro</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} data-testid={`member-row-${member.id}`}>
                      <td>
                        <div>
                          <p className="font-medium text-slate-800">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.email}</p>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-sm">{member.nif}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(member.incorporation_status)}`}>
                          {getStatusLabel(member.incorporation_status)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(member.payment_status)}`}>
                          {getStatusLabel(member.payment_status)}
                        </span>
                      </td>
                      <td>
                        {member.is_provider ? (
                          <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Proveedor</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">Participante</Badge>
                        )}
                      </td>
                      <td className="text-sm text-slate-500">
                        {formatDate(member.created_at)}
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`member-actions-${member.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetails(member)}>
                              <Users className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDownloadRegistrationCertificate(member.id, member.nif)}
                              disabled={actionLoading}
                            >
                              <Award className="mr-2 h-4 w-4" />
                              Descargar certificado registro
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleProvider(member.id)}
                              disabled={actionLoading}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              {member.is_provider ? 'Quitar proveedor' : 'Hacer proveedor'}
                            </DropdownMenuItem>
                            {member.contract_signed && member.payment_status === 'paid' && !member.identity_evidence_id && (
                              <DropdownMenuItem 
                                onClick={() => handleGenerateIdentity(member.id)}
                                disabled={actionLoading}
                              >
                                <FileCheck className="mr-2 h-4 w-4" />
                                Generar evidencia identidad
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleExportDossier(member.id, member.nif)}
                              disabled={actionLoading}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Exportar expediente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-outfit">Detalles del Miembro</DialogTitle>
            <DialogDescription>Información completa del miembro</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-link-blue flex items-center justify-center text-white font-bold text-lg">
                  {selectedMember.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedMember.name}</h3>
                  <p className="text-slate-500">{selectedMember.organization}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{selectedMember.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span className="font-mono">{selectedMember.nif}</span>
                </div>
                {selectedMember.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{selectedMember.phone}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm text-slate-700">Estado de Incorporación</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    {selectedMember.contract_signed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-sm">Contrato</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    {selectedMember.payment_status === 'paid' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-sm">Pago</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    {selectedMember.identity_evidence_id ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-sm">Identidad</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    {selectedMember.incorporation_status === 'effective' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm">Efectivo</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleExportDossier(selectedMember.id, selectedMember.nif)}
                  disabled={actionLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Expediente
                </Button>
                {selectedMember.contract_signed && selectedMember.payment_status === 'paid' && !selectedMember.identity_evidence_id && (
                  <Button 
                    className="flex-1 bg-link-blue hover:bg-sky-700"
                    onClick={() => {
                      handleGenerateIdentity(selectedMember.id);
                      setDetailsOpen(false);
                    }}
                    disabled={actionLoading}
                  >
                    <FileCheck className="w-4 h-4 mr-2" />
                    Generar Identidad
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
