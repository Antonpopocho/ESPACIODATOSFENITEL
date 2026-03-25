import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { datasetsApi } from '../lib/api';
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
  Database, 
  Upload, 
  Download, 
  FileJson, 
  FileSpreadsheet,
  Loader2,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye
} from 'lucide-react';
import { formatDate, formatDateTime, getStatusLabel, getStatusClass, downloadBlob } from '../lib/utils';
import { toast } from 'sonner';

export default function MyDatasets() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    keywords: '',
    category: 'general',
    license: 'CC-BY-4.0',
    access_rights: 'restricted',
    file: null,
  });

  const fetchDatasets = async () => {
    try {
      const response = await datasetsApi.list();
      setDatasets(response.data.filter(d => d.user_id === user.id));
    } catch (error) {
      toast.error('Error al cargar datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [user.id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
        toast.error('Solo se permiten archivos CSV o JSON');
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleUpload = async () => {
    if (!formData.file || !formData.title || !formData.description) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', formData.file);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('keywords', formData.keywords);
      data.append('category', formData.category);
      data.append('license', formData.license);
      data.append('access_rights', formData.access_rights);

      await datasetsApi.upload(data);
      await fetchDatasets();
      setUploadDialogOpen(false);
      resetForm();
      toast.success('Dataset subido correctamente');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al subir dataset');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      keywords: '',
      category: 'general',
      license: 'CC-BY-4.0',
      access_rights: 'restricted',
      file: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (dataset) => {
    try {
      const response = await datasetsApi.download(dataset.id);
      downloadBlob(response.data, `${dataset.title}.${dataset.file_type}`);
    } catch (error) {
      toast.error('Error al descargar dataset');
    }
  };

  const openDetails = (dataset) => {
    setSelectedDataset(dataset);
    setDetailsDialogOpen(true);
  };

  const canUpload = user?.is_provider && user?.incorporation_status === 'effective';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-bold text-slate-800">Mis Datasets</h1>
          <p className="text-slate-500 mt-1">Gestiona tus conjuntos de datos</p>
        </div>
        {canUpload && (
          <Button 
            className="bg-link-blue hover:bg-sky-700"
            onClick={() => setUploadDialogOpen(true)}
            data-testid="upload-dataset-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Subir Dataset
          </Button>
        )}
      </div>

      {!canUpload && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Acceso Restringido</p>
                <p className="text-sm text-amber-700">
                  {user?.incorporation_status !== 'effective' 
                    ? 'Debes completar la incorporación efectiva para subir datasets.'
                    : 'Contacta con FENITEL para obtener permisos de proveedor.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Datasets Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
        </div>
      ) : datasets.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-12">
            <div className="text-center">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-medium text-slate-800 mb-2">No tienes datasets</h3>
              <p className="text-sm text-slate-500">
                {canUpload ? 'Sube tu primer dataset para comenzar.' : 'Los datasets aparecerán aquí cuando los subas.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.map((dataset) => (
            <Card key={dataset.id} className="border-slate-200 card-hover" data-testid={`dataset-card-${dataset.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {dataset.file_type === 'json' ? (
                      <FileJson className="w-8 h-8 text-amber-500" />
                    ) : (
                      <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                    )}
                    <div>
                      <h3 className="font-medium text-slate-800 line-clamp-1">{dataset.title}</h3>
                      <p className="text-xs text-slate-500">{dataset.file_type.toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{dataset.description}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  <span className={`status-badge ${getStatusClass(dataset.status)}`}>
                    {getStatusLabel(dataset.status)}
                  </span>
                  <span className={`status-badge ${getStatusClass(dataset.validation_status)}`}>
                    {getStatusLabel(dataset.validation_status)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">{formatDate(dataset.created_at)}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openDetails(dataset)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(dataset)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-outfit">Subir Dataset</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV o JSON al catálogo de datos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Nombre del dataset"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="dataset-title-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción *</Label>
              <Textarea
                placeholder="Describe el contenido del dataset"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="dataset-description-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Palabras clave</Label>
              <Input
                placeholder="telecomunicaciones, fibra, instalación"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                data-testid="dataset-keywords-input"
              />
              <p className="text-xs text-slate-500">Separadas por comas</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger data-testid="dataset-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTP">UTP - Cableado Estructurado</SelectItem>
                    <SelectItem value="ICT">ICT - Infraestructuras Comunes</SelectItem>
                    <SelectItem value="FM">FM - Radiodifusión</SelectItem>
                    <SelectItem value="SAT">SAT - Comunicaciones Satélite</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Licencia</Label>
                <Select
                  value={formData.license}
                  onValueChange={(value) => setFormData({ ...formData, license: value })}
                >
                  <SelectTrigger data-testid="dataset-license-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC-BY-4.0">CC-BY-4.0</SelectItem>
                    <SelectItem value="CC-BY-SA-4.0">CC-BY-SA-4.0</SelectItem>
                    <SelectItem value="CC0">CC0 (Dominio Público)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Archivo *</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.json"
                  className="hidden"
                  data-testid="dataset-file-input"
                />
                {formData.file ? (
                  <div className="flex items-center justify-center gap-2">
                    {formData.file.name.endsWith('.json') ? (
                      <FileJson className="w-8 h-8 text-amber-500" />
                    ) : (
                      <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                    )}
                    <span className="font-medium">{formData.file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Arrastra o haz clic para seleccionar</p>
                    <p className="text-xs text-slate-400">CSV o JSON</p>
                  </>
                )}
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar archivo
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setUploadDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-link-blue hover:bg-sky-700"
                onClick={handleUpload}
                disabled={uploading}
                data-testid="submit-dataset-button"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Subir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-outfit">Detalles del Dataset</DialogTitle>
          </DialogHeader>
          {selectedDataset && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                {selectedDataset.file_type === 'json' ? (
                  <FileJson className="w-10 h-10 text-amber-500" />
                ) : (
                  <FileSpreadsheet className="w-10 h-10 text-emerald-500" />
                )}
                <div>
                  <h3 className="font-semibold">{selectedDataset.title}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedDataset.file_type.toUpperCase()} · {(selectedDataset.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-slate-500">Descripción</Label>
                <p className="text-sm">{selectedDataset.description}</p>
              </div>

              {selectedDataset.keywords.length > 0 && (
                <div>
                  <Label className="text-slate-500">Palabras clave</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDataset.keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Estado</Label>
                  <p className={`status-badge ${getStatusClass(selectedDataset.status)} inline-block mt-1`}>
                    {getStatusLabel(selectedDataset.status)}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500">Validación</Label>
                  <p className={`status-badge ${getStatusClass(selectedDataset.validation_status)} inline-block mt-1`}>
                    {getStatusLabel(selectedDataset.validation_status)}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500">Licencia</Label>
                  <p className="text-sm font-medium">{selectedDataset.license}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Versión</Label>
                  <p className="text-sm font-medium">v{selectedDataset.version}</p>
                </div>
              </div>

              <div>
                <Label className="text-slate-500">Creado</Label>
                <p className="text-sm">{formatDateTime(selectedDataset.created_at)}</p>
              </div>

              {selectedDataset.publication_evidence_id && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Publicado con evidencia</span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full"
                variant="outline"
                onClick={() => handleDownload(selectedDataset)}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Dataset
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
