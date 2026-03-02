import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { datasetsApi } from '../lib/api';
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
  Database, 
  Search, 
  FileJson, 
  FileSpreadsheet,
  Loader2,
  MoreVertical,
  CheckCircle,
  Eye,
  Download,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { formatDate, formatDateTime, getStatusLabel, getStatusClass, downloadBlob } from '../lib/utils';
import { toast } from 'sonner';

export default function Datasets() {
  const { isPromotor } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDatasets = async () => {
    try {
      const response = await datasetsApi.list();
      setDatasets(response.data);
    } catch (error) {
      toast.error('Error al cargar datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = 
      dataset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || dataset.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleValidate = async (datasetId) => {
    setActionLoading(true);
    try {
      await datasetsApi.validate(datasetId);
      await fetchDatasets();
      toast.success('Dataset validado');
    } catch (error) {
      toast.error('Error al validar dataset');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (datasetId) => {
    setActionLoading(true);
    try {
      await datasetsApi.publish(datasetId);
      await fetchDatasets();
      toast.success('Dataset publicado con evidencia');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al publicar dataset');
    } finally {
      setActionLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-bold text-slate-800">
            {isPromotor ? 'Gestión de Datasets' : 'Catálogo de Datos'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isPromotor ? 'Validación y publicación de datasets' : 'Explora los datasets del espacio de datos'}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="dataset-search-input"
            />
          </div>
          {isPromotor && (
            <select 
              className="px-3 py-2 border border-slate-200 rounded-md text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              data-testid="dataset-filter-select"
            >
              <option value="all">Todos</option>
              <option value="draft">Borrador</option>
              <option value="published">Publicados</option>
            </select>
          )}
        </div>
      </div>

      {/* Stats for Promotor */}
      {isPromotor && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-500 flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="text-2xl font-outfit font-bold text-slate-800">{datasets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-compliance-amber flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Pendientes</p>
                  <p className="text-2xl font-outfit font-bold text-slate-800">
                    {datasets.filter(d => d.status === 'draft').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-verified-green flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Publicados</p>
                  <p className="text-2xl font-outfit font-bold text-slate-800">
                    {datasets.filter(d => d.status === 'published').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Datasets Table/Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
        </div>
      ) : filteredDatasets.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-12">
            <div className="text-center">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-medium text-slate-800 mb-2">No se encontraron datasets</h3>
              <p className="text-sm text-slate-500">Ajusta los filtros o espera a que se publiquen nuevos datos.</p>
            </div>
          </CardContent>
        </Card>
      ) : isPromotor ? (
        <Card className="border-slate-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Dataset</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Validación</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDatasets.map((dataset) => (
                    <tr key={dataset.id} data-testid={`dataset-row-${dataset.id}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          {dataset.file_type === 'json' ? (
                            <FileJson className="w-8 h-8 text-amber-500" />
                          ) : (
                            <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                          )}
                          <div>
                            <p className="font-medium text-slate-800">{dataset.title}</p>
                            <p className="text-sm text-slate-500 line-clamp-1">{dataset.description}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="outline">{dataset.category}</Badge>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(dataset.status)}`}>
                          {getStatusLabel(dataset.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(dataset.validation_status)}`}>
                          {getStatusLabel(dataset.validation_status)}
                        </span>
                      </td>
                      <td className="text-sm text-slate-500">
                        {formatDate(dataset.created_at)}
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`dataset-actions-${dataset.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetails(dataset)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(dataset)}>
                              <Download className="mr-2 h-4 w-4" />
                              Descargar
                            </DropdownMenuItem>
                            {dataset.status === 'draft' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleValidate(dataset.id)}
                                  disabled={actionLoading}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Validar
                                </DropdownMenuItem>
                                {dataset.validation_status === 'valid' && (
                                  <DropdownMenuItem 
                                    onClick={() => handlePublish(dataset.id)}
                                    disabled={actionLoading}
                                  >
                                    <FileCheck className="mr-2 h-4 w-4" />
                                    Publicar
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Grid view for non-promotors
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDatasets.filter(d => d.status === 'published').map((dataset) => (
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
                      <p className="text-xs text-slate-500">{dataset.category}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{dataset.description}</p>

                {dataset.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {dataset.keywords.slice(0, 3).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                )}

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
                    {selectedDataset.file_type.toUpperCase()} · {(selectedDataset.file_size / 1024).toFixed(2)} KB · v{selectedDataset.version}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Descripción</p>
                <p className="text-sm">{selectedDataset.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Categoría</p>
                  <p className="font-medium">{selectedDataset.category}</p>
                </div>
                <div>
                  <p className="text-slate-500">Licencia</p>
                  <p className="font-medium">{selectedDataset.license}</p>
                </div>
                <div>
                  <p className="text-slate-500">Derechos de acceso</p>
                  <p className="font-medium">{selectedDataset.access_rights}</p>
                </div>
                <div>
                  <p className="text-slate-500">Creado</p>
                  <p className="font-medium">{formatDate(selectedDataset.created_at)}</p>
                </div>
              </div>

              {selectedDataset.keywords.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Palabras clave</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDataset.keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* DCAT Metadata */}
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Metadatos DCAT-AP</p>
                <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto font-mono">
                  {JSON.stringify(selectedDataset.dcat_metadata, null, 2)}
                </pre>
              </div>

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
