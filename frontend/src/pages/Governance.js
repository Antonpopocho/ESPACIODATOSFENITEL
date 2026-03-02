import React, { useState, useEffect } from 'react';
import { governanceApi, membersApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
  Shield, 
  Users, 
  FileText,
  Plus,
  Loader2,
  Trash2,
  UserPlus,
  BookOpen
} from 'lucide-react';
import { formatDate, formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

export default function Governance() {
  const [committee, setCommittee] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addDecisionOpen, setAddDecisionOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [memberForm, setMemberForm] = useState({
    user_id: '',
    role: 'miembro',
  });

  const [decisionForm, setDecisionForm] = useState({
    title: '',
    description: '',
    decision_type: 'acuerdo',
    participants: [],
  });

  const fetchData = async () => {
    try {
      const [committeeRes, decisionsRes, membersRes] = await Promise.all([
        governanceApi.listCommittee(),
        governanceApi.listDecisions(),
        membersApi.list(),
      ]);
      setCommittee(committeeRes.data);
      setDecisions(decisionsRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Error fetching governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCommitteeMember = async () => {
    if (!memberForm.user_id) {
      toast.error('Selecciona un miembro');
      return;
    }

    setSaving(true);
    try {
      await governanceApi.addCommitteeMember(memberForm);
      await fetchData();
      setAddMemberOpen(false);
      setMemberForm({ user_id: '', role: 'miembro' });
      toast.success('Miembro añadido al comité');
    } catch (error) {
      toast.error('Error al añadir miembro');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCommitteeMember = async (memberId) => {
    try {
      await governanceApi.removeCommitteeMember(memberId);
      await fetchData();
      toast.success('Miembro eliminado del comité');
    } catch (error) {
      toast.error('Error al eliminar miembro');
    }
  };

  const handleAddDecision = async () => {
    if (!decisionForm.title || !decisionForm.description) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      await governanceApi.createDecision(decisionForm);
      await fetchData();
      setAddDecisionOpen(false);
      setDecisionForm({ title: '', description: '', decision_type: 'acuerdo', participants: [] });
      toast.success('Decisión registrada');
    } catch (error) {
      toast.error('Error al registrar decisión');
    } finally {
      setSaving(false);
    }
  };

  const availableMembers = members.filter(
    m => !committee.some(c => c.user_id === m.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-outfit font-bold text-slate-800">Panel de Gobernanza</h1>
        <p className="text-slate-500 mt-1">Gestión del comité y decisiones del Espacio de Datos</p>
      </div>

      <Tabs defaultValue="committee" className="space-y-6">
        <TabsList>
          <TabsTrigger value="committee" data-testid="tab-committee">
            <Users className="w-4 h-4 mr-2" />
            Comité
          </TabsTrigger>
          <TabsTrigger value="decisions" data-testid="tab-decisions">
            <BookOpen className="w-4 h-4 mr-2" />
            Decisiones
          </TabsTrigger>
        </TabsList>

        {/* Committee Tab */}
        <TabsContent value="committee">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-outfit">Comité de Gobernanza</CardTitle>
                  <CardDescription>Miembros del órgano de gobierno del espacio de datos</CardDescription>
                </div>
                <Button 
                  onClick={() => setAddMemberOpen(true)}
                  className="bg-link-blue hover:bg-sky-700"
                  data-testid="add-committee-member-button"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Añadir Miembro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-link-blue" />
                </div>
              ) : committee.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No hay miembros en el comité</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {committee.map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                      data-testid={`committee-member-${member.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-link-blue flex items-center justify-center text-white font-medium">
                          {member.user_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{member.user_name}</p>
                          <p className="text-sm text-slate-500">{member.user_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium capitalize">{member.role}</p>
                          <p className="text-xs text-slate-500">Desde {formatDate(member.start_date)}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveCommitteeMember(member.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Decisions Tab */}
        <TabsContent value="decisions">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-outfit">Registro de Decisiones</CardTitle>
                  <CardDescription>Acuerdos y actas del comité de gobernanza</CardDescription>
                </div>
                <Button 
                  onClick={() => setAddDecisionOpen(true)}
                  className="bg-link-blue hover:bg-sky-700"
                  data-testid="add-decision-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Decisión
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-link-blue" />
                </div>
              ) : decisions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No hay decisiones registradas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {decisions.map((decision) => (
                    <div 
                      key={decision.id}
                      className="p-4 border border-slate-200 rounded-lg"
                      data-testid={`decision-${decision.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-slate-800">{decision.title}</h4>
                          <span className="text-xs text-slate-500 uppercase tracking-wider">
                            {decision.decision_type}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(decision.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{decision.description}</p>
                      {decision.participants.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-500">
                            Participantes: {decision.participants.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Committee Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit">Añadir Miembro al Comité</DialogTitle>
            <DialogDescription>
              Selecciona un miembro del espacio de datos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Miembro</Label>
              <Select
                value={memberForm.user_id}
                onValueChange={(value) => setMemberForm({ ...memberForm, user_id: value })}
              >
                <SelectTrigger data-testid="select-committee-member">
                  <SelectValue placeholder="Seleccionar miembro" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.nif})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rol en el Comité</Label>
              <Select
                value={memberForm.role}
                onValueChange={(value) => setMemberForm({ ...memberForm, role: value })}
              >
                <SelectTrigger data-testid="select-committee-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presidente">Presidente</SelectItem>
                  <SelectItem value="secretario">Secretario</SelectItem>
                  <SelectItem value="vocal">Vocal</SelectItem>
                  <SelectItem value="miembro">Miembro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setAddMemberOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-link-blue hover:bg-sky-700"
                onClick={handleAddCommitteeMember}
                disabled={saving}
                data-testid="save-committee-member-button"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Añadir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Decision Dialog */}
      <Dialog open={addDecisionOpen} onOpenChange={setAddDecisionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit">Registrar Decisión</DialogTitle>
            <DialogDescription>
              Documenta un acuerdo o acta del comité
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Título de la decisión"
                value={decisionForm.title}
                onChange={(e) => setDecisionForm({ ...decisionForm, title: e.target.value })}
                data-testid="decision-title-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={decisionForm.decision_type}
                onValueChange={(value) => setDecisionForm({ ...decisionForm, decision_type: value })}
              >
                <SelectTrigger data-testid="decision-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acuerdo">Acuerdo</SelectItem>
                  <SelectItem value="acta">Acta</SelectItem>
                  <SelectItem value="reglamento">Reglamento</SelectItem>
                  <SelectItem value="resolucion">Resolución</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descripción *</Label>
              <Textarea
                placeholder="Detalle de la decisión"
                value={decisionForm.description}
                onChange={(e) => setDecisionForm({ ...decisionForm, description: e.target.value })}
                rows={4}
                data-testid="decision-description-input"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setAddDecisionOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-link-blue hover:bg-sky-700"
                onClick={handleAddDecision}
                disabled={saving}
                data-testid="save-decision-button"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Registrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
