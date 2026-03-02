import React, { useState, useEffect } from 'react';
import { paymentsApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
  CreditCard, 
  Search, 
  Loader2,
  CheckCircle,
  Clock,
  Edit
} from 'lucide-react';
import { formatDate, formatCurrency, getStatusLabel, getStatusClass } from '../lib/utils';
import { toast } from 'sonner';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [formData, setFormData] = useState({
    status: 'pending',
    amount: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchPayments = async () => {
    try {
      const response = await paymentsApi.list();
      setPayments(response.data);
    } catch (error) {
      toast.error('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(payment =>
    payment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.user_nif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditDialog = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      status: payment.status,
      amount: payment.amount || '',
      notes: payment.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await paymentsApi.update(selectedPayment.user_id, {
        status: formData.status,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        notes: formData.notes || null,
      });
      await fetchPayments();
      setEditDialogOpen(false);
      toast.success('Pago actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar pago');
    } finally {
      setSaving(false);
    }
  };

  const paidCount = payments.filter(p => p.status === 'paid').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const totalAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-bold text-slate-800">Gestión de Pagos</h1>
          <p className="text-slate-500 mt-1">Control de cuotas de incorporación</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar pagos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="payment-search-input"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-verified-green flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pagados</p>
                <p className="text-2xl font-outfit font-bold text-slate-800">{paidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-compliance-amber flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pendientes</p>
                <p className="text-2xl font-outfit font-bold text-slate-800">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-link-blue flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Recaudado</p>
                <p className="text-2xl font-outfit font-bold text-slate-800">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-link-blue" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <CreditCard className="w-12 h-12 mb-4 text-slate-300" />
              <p>No se encontraron pagos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Miembro</th>
                    <th>NIF</th>
                    <th>Estado</th>
                    <th>Importe</th>
                    <th>Fecha Pago</th>
                    <th>Notas</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.user_id} data-testid={`payment-row-${payment.user_id}`}>
                      <td>
                        <div>
                          <p className="font-medium text-slate-800">{payment.user_name}</p>
                          <p className="text-sm text-slate-500">{payment.user_email}</p>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-sm">{payment.user_nif}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="font-medium">
                        {payment.amount ? formatCurrency(payment.amount) : '-'}
                      </td>
                      <td className="text-sm text-slate-500">
                        {formatDate(payment.paid_at)}
                      </td>
                      <td className="text-sm text-slate-500 max-w-xs truncate">
                        {payment.notes || '-'}
                      </td>
                      <td>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(payment)}
                          data-testid={`edit-payment-${payment.user_id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit">Actualizar Pago</DialogTitle>
            <DialogDescription>
              {selectedPayment?.user_name} - {selectedPayment?.user_nif}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estado del Pago</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-testid="payment-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Importe (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                data-testid="payment-amount-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Notas sobre el pago..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                data-testid="payment-notes-input"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-link-blue hover:bg-sky-700"
                onClick={handleSave}
                disabled={saving}
                data-testid="save-payment-button"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
