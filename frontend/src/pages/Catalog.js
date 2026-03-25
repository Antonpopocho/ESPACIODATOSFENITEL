import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { datasetsApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  Database, 
  Search, 
  FileJson, 
  FileSpreadsheet,
  Loader2,
  Download,
  Eye,
  Building,
  Calendar,
  Tag,
  FileText,
  Wifi,
  Radio,
  Satellite,
  Cable,
  LayoutGrid
} from 'lucide-react';
import { formatDate, formatDateTime, downloadBlob } from '../lib/utils';
import { toast } from 'sonner';

// Categorías sectoriales FENITEL
const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: LayoutGrid, color: 'bg-slate-500' },
  { id: 'UTP', name: 'UTP - Cableado Estructurado', icon: Cable, color: 'bg-blue-500', description: 'Datos de instalaciones de cableado estructurado UTP/FTP' },
  { id: 'ICT', name: 'ICT - Infraestructuras Comunes', icon: Building, color: 'bg-emerald-500', description: 'Infraestructuras Comunes de Telecomunicaciones en edificios' },
  { id: 'FM', name: 'FM - Radiodifusión', icon: Radio, color: 'bg-orange-500', description: 'Datos de instalaciones de radiodifusión FM' },
  { id: 'SAT', name: 'SAT - Comunicaciones Satélite', icon: Satellite, color: 'bg-purple-500', description: 'Datos de instalaciones de comunicaciones por satélite' },
  { id: 'general', name: 'General', icon: Database, color: 'bg-gray-500', description: 'Otros datos sectoriales' },
];

export default function Catalog() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        // Use the full catalog endpoint that returns all published datasets
        const response = await datasetsApi.getFullCatalog();
        setDatasets(response.data || []);
      } catch (error) {
        console.error('Error fetching catalog:', error);
        toast.error('Error al cargar el catálogo');
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = 
      dataset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dataset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = async (dataset) => {
    try {
      const response = await datasetsApi.download(dataset.id);
      downloadBlob(response.data, `${dataset.title}.${dataset.file_type}`);
      toast.success('Dataset descargado');
    } catch (error) {
      toast.error('Error al descargar dataset');
    }
  };

  const openDetails = (dataset) => {
    setSelectedDataset(dataset);
    setDetailsDialogOpen(true);
  };

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
  };

  const getDatasetCountByCategory = (categoryId) => {
    if (categoryId === 'all') return datasets.length;
    return datasets.filter(d => d.category === categoryId).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-outfit font-bold text-slate-800">Catálogo de Datos Sectoriales</h1>
        <p className="text-slate-500 mt-1">Espacio de Datos FENITEL - Datasets publicados por miembros</p>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar datasets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="catalog-search-input"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const count = getDatasetCountByCategory(category.id);
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border data-[state=active]:border-transparent data-[state=active]:text-white transition-all ${
                  selectedCategory === category.id ? category.color : 'bg-white border-slate-200'
                }`}
                data-testid={`category-tab-${category.id}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{category.name.split(' - ')[0]}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Category Description */}
        {selectedCategory !== 'all' && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              {(() => {
                const cat = getCategoryInfo(selectedCategory);
                const Icon = cat.icon;
                return (
                  <>
                    <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">{cat.name}</h3>
                      <p className="text-sm text-slate-500">{cat.description}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Datasets Grid */}
        <TabsContent value={selectedCategory} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
            </div>
          ) : filteredDatasets.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-12">
                <div className="text-center">
                  <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-800 mb-2">No hay datasets en esta categoría</h3>
                  <p className="text-sm text-slate-500">
                    Los datasets publicados por los miembros aparecerán aquí.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDatasets.map((dataset) => {
                const category = getCategoryInfo(dataset.category);
                const CategoryIcon = category.icon;
                return (
                  <Card 
                    key={dataset.id} 
                    className="border-slate-200 card-hover overflow-hidden"
                    data-testid={`catalog-dataset-${dataset.id}`}
                  >
                    {/* Category Header */}
                    <div className={`${category.color} px-4 py-2 flex items-center gap-2`}>
                      <CategoryIcon className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">
                        {category.name.split(' - ')[0]}
                      </span>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {dataset.file_type === 'json' ? (
                          <FileJson className="w-8 h-8 text-amber-500 flex-shrink-0" />
                        ) : (
                          <FileSpreadsheet className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-medium text-slate-800 line-clamp-1">{dataset.title}</h3>
                          <p className="text-xs text-slate-500">{dataset.file_type.toUpperCase()} · {(dataset.file_size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{dataset.description}</p>

                      {/* Publisher Info */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        <Building className="w-3 h-3" />
                        <span>{dataset.dcat_metadata?.publisher?.name || 'Proveedor'}</span>
                        <span className="text-slate-300">•</span>
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(dataset.created_at)}</span>
                      </div>

                      {/* Keywords */}
                      {dataset.keywords && dataset.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {dataset.keywords.slice(0, 3).map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => openDetails(dataset)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detalles
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDownload(dataset)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stats Summary */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-outfit font-bold text-slate-800">{datasets.length}</p>
                <p className="text-sm text-slate-500">Datasets publicados</p>
              </div>
              <div className="h-10 w-px bg-slate-300" />
              <div className="flex gap-4">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                  const count = getDatasetCountByCategory(cat.id);
                  if (count === 0) return null;
                  const Icon = cat.icon;
                  return (
                    <div key={cat.id} className="flex items-center gap-1 text-sm">
                      <Icon className={`w-4 h-4 ${cat.color.replace('bg-', 'text-').replace('-500', '-600')}`} />
                      <span className="font-medium">{count}</span>
                      <span className="text-slate-500 hidden sm:inline">{cat.name.split(' - ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Catálogo DCAT-AP conforme a Orden TDF/758/2025
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-outfit">Detalles del Dataset</DialogTitle>
          </DialogHeader>
          {selectedDataset && (
            <div className="space-y-4">
              {/* Header with category */}
              {(() => {
                const cat = getCategoryInfo(selectedDataset.category);
                const CatIcon = cat.icon;
                return (
                  <div className={`${cat.color} rounded-lg p-4 flex items-center gap-3`}>
                    {selectedDataset.file_type === 'json' ? (
                      <FileJson className="w-10 h-10 text-white" />
                    ) : (
                      <FileSpreadsheet className="w-10 h-10 text-white" />
                    )}
                    <div className="text-white">
                      <h3 className="font-semibold text-lg">{selectedDataset.title}</h3>
                      <p className="text-sm opacity-90 flex items-center gap-2">
                        <CatIcon className="w-4 h-4" />
                        {cat.name}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Descripción</p>
                <p className="text-sm">{selectedDataset.description}</p>
              </div>

              {/* Publisher */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-500 mb-1">Proveedor</p>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{selectedDataset.dcat_metadata?.publisher?.name}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-sm text-slate-500">{selectedDataset.dcat_metadata?.publisher?.identifier}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Formato</p>
                  <p className="font-medium">{selectedDataset.file_type.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Tamaño</p>
                  <p className="font-medium">{(selectedDataset.file_size / 1024).toFixed(2)} KB</p>
                </div>
                <div>
                  <p className="text-slate-500">Licencia</p>
                  <p className="font-medium">{selectedDataset.license}</p>
                </div>
                <div>
                  <p className="text-slate-500">Publicado</p>
                  <p className="font-medium">{formatDate(selectedDataset.created_at)}</p>
                </div>
              </div>

              {selectedDataset.keywords && selectedDataset.keywords.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Palabras clave</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDataset.keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* DCAT Identifier */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-1">Identificador DCAT-AP</p>
                <p className="text-xs font-mono text-blue-800">{selectedDataset.id}</p>
              </div>

              <Button 
                className="w-full bg-link-blue hover:bg-sky-700"
                onClick={() => {
                  handleDownload(selectedDataset);
                  setDetailsDialogOpen(false);
                }}
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
