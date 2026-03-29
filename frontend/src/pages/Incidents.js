import React, { useState, useEffect } from 'react';
import { incidentsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  AlertCircle, 
  Plus, 
  Loader2,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

const priorityColors = {
  baja: 'bg-gray-100 text-gray-800',
  media: 'bg-blue-100 text-blue-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800'
};

const statusColors = {
  abierta: 'bg-yellow-100 text-yellow-800',
  en_proceso: 'bg-blue-100 text-blue-800',
  resuelta: 'bg-green-100 text-green-800',
  cerrada: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  abierta: 'Abierta',
  en_proceso: 'En Proceso',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada'
};

const typeLabels = {
  reclamacion: 'Reclamación',
  incidencia: 'Incidencia',
  consulta: 'Consulta'
};

export default function Incidents() {
  const { user } = useAuth();
  const isPromotor = user?.role === 'promotor';
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    incident_type: 'incidencia',
    priority: 'media'
  });

  const [updateForm, setUpdateForm] = useState({
    status: '',
    resolution: '',
    priority: ''
  });

  const fetchIncidents = async () => {
    try {
      const response = await incidentsApi.list();
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Error al cargar incidencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.description) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      await incidentsApi.create(form);
      await fetchIncidents();
      setCreateOpen(false);
      setForm({ title: '', description: '', incident_type: 'incidencia', priority: 'media' });
      toast.success('Incidencia creada correctamente');
    } catch (error) {
      toast.error('Error al crear incidencia');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedIncident) return;

    setSaving(true);
    try {
      const updateData = {};
      if (updateForm.status) updateData.status = updateForm.status;
      if (updateForm.resolution) updateData.resolution = updateForm.resolution;
      if (updateForm.priority) updateData.priority = updateForm.priority;

      await incidentsApi.update(selectedIncident.id, updateData);
      await fetchIncidents();
      setDetailOpen(false);
      setSelectedIncident(null);
      toast.success('Incidencia actualizada');
    } catch (error) {
      toast.error('Error al actualizar incidencia');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = (incident) => {
    setSelectedIncident(incident);
    setUpdateForm({
      status: incident.status,
      resolution: incident.resolution || '',
      priority: incident.priority
    });
    setDetailOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'abierta': return <AlertCircle className="w-4 h-4" />;
      case 'en_proceso': return <Clock className="w-4 h-4" />;
      case 'resuelta': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-outfit font-bold text-telecom-navy">
            Incidencias y Reclamaciones
          </h1>
          <p className="text-slate-600">
            Sistema de gestión de incidencias conforme a UNE 0087:2025
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-link-blue hover:bg-sky-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Incidencia
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incidents.filter(i => i.status === 'abierta').length}</p>
                <p className="text-sm text-slate-600">Abiertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incidents.filter(i => i.status === 'en_proceso').length}</p>
                <p className="text-sm text-slate-600">En Proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incidents.filter(i => i.status === 'resuelta').length}</p>
                <p className="text-sm text-slate-600">Resueltas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incidents.filter(i => i.priority === 'critica').length}</p>
                <p className="text-sm text-slate-600">Críticas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Incidencias</CardTitle>
          <CardDescription>
            {isPromotor ? 'Todas las incidencias del espacio de datos' : 'Mis incidencias'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No hay incidencias registradas</p>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div 
                  key={incident.id}
                  className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => openDetail(incident)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${statusColors[incident.status]}`}>
                        {getStatusIcon(incident.status)}
                      </div>
                      <div>
                        <h3 className="font-medium text-telecom-navy">{incident.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-1">{incident.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{typeLabels[incident.incident_type]}</Badge>
                          <Badge className={priorityColors[incident.priority]}>
                            {incident.priority.toUpperCase()}
                          </Badge>
                          {isPromotor && (
                            <span className="text-xs text-slate-500">
                              por {incident.user_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={statusColors[incident.status]}>
                        {statusLabels[incident.status]}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDateTime(incident.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Incidencia</DialogTitle>
            <DialogDescription>
              Registre una incidencia, reclamación o consulta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.incident_type} onValueChange={(v) => setForm({ ...form, incident_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incidencia">Incidencia</SelectItem>
                  <SelectItem value="reclamacion">Reclamación</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridad</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Resumen del problema"
              />
            </div>
            <div>
              <Label>Descripción *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describa el problema en detalle"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear Incidencia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Incidencia</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Tipo</Label>
                  <p className="font-medium">{typeLabels[selectedIncident.incident_type]}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Creada por</Label>
                  <p className="font-medium">{selectedIncident.user_name}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Fecha de creación</Label>
                  <p className="font-medium">{formatDateTime(selectedIncident.created_at)}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Estado actual</Label>
                  <Badge className={statusColors[selectedIncident.status]}>
                    {statusLabels[selectedIncident.status]}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-slate-500">Título</Label>
                <p className="font-medium">{selectedIncident.title}</p>
              </div>
              
              <div>
                <Label className="text-slate-500">Descripción</Label>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedIncident.description}</p>
              </div>

              {selectedIncident.resolution && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <Label className="text-green-700">Resolución</Label>
                  <p className="text-green-800">{selectedIncident.resolution}</p>
                </div>
              )}

              {isPromotor && selectedIncident.status !== 'cerrada' && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium">Actualizar Incidencia</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Estado</Label>
                      <Select value={updateForm.status} onValueChange={(v) => setUpdateForm({ ...updateForm, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="abierta">Abierta</SelectItem>
                          <SelectItem value="en_proceso">En Proceso</SelectItem>
                          <SelectItem value="resuelta">Resuelta</SelectItem>
                          <SelectItem value="cerrada">Cerrada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Prioridad</Label>
                      <Select value={updateForm.priority} onValueChange={(v) => setUpdateForm({ ...updateForm, priority: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="critica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Resolución</Label>
                    <Textarea
                      value={updateForm.resolution}
                      onChange={(e) => setUpdateForm({ ...updateForm, resolution: e.target.value })}
                      placeholder="Describa la resolución del problema"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDetailOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleUpdate} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Guardar Cambios
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
