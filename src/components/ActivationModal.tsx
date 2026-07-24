import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { X, Loader2, Smartphone, ShieldCheck, User, List, Calendar, FileText } from 'lucide-react';
import { getClients } from '@/lib/clients.functions';
import { getLists } from '@/lib/lists.functions';
import { activateDeviceAction } from '@/lib/devices.functions';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  activationCodeId?: string;
  deviceName?: string;
}

export function ActivationModal({ isOpen, onClose, initialCode = "", activationCodeId, deviceName }: ActivationModalProps) {
  const [code, setCode] = useState(initialCode);
  const [form, setForm] = useState({
    cliente_id: "",
    lista_id: "",
    expires_at: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    observacao: ""
  });

  const queryClient = useQueryClient();
  const getClientsFn = useServerFn(getClients);
  const getListsFn = useServerFn(getLists);
  const activateFn = useServerFn(activateDeviceAction);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-all"],
    queryFn: () => getClientsFn(),
    enabled: isOpen
  });

  const { data: lists = [] } = useQuery({
    queryKey: ["lists-all"],
    queryFn: () => getListsFn(),
    enabled: isOpen
  });

  const activateMutation = useMutation({
    mutationFn: (data: any) => activateFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-activations"] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Dispositivo ativado com sucesso!");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha na ativação");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    activateMutation.mutate({
      activation_code_id: activationCodeId,
      code: activationCodeId ? undefined : code,
      cliente_id: form.cliente_id,
      lista_id: form.lista_id,
      expires_at: new Date(form.expires_at).toISOString(),
      observacao: form.observacao
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary" size={24} />
            <h3 className="text-lg font-bold">Ativar Dispositivo</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {deviceName && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl mb-2">
              <Smartphone size={18} className="text-primary" />
              <span className="text-sm font-semibold">{deviceName}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Smartphone size={16} className="text-muted-foreground" />
              Código de Ativação
            </label>
            <input
              required
              disabled={!!activationCodeId}
              type="text"
              placeholder="Digite o código de 6 dígitos"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 uppercase font-mono font-bold text-lg text-center"
              value={activationCodeId ? initialCode : code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <User size={16} className="text-muted-foreground" />
                Cliente
              </label>
              <select
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50"
                value={form.cliente_id}
                onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
              >
                <option value="">Selecionar...</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <List size={16} className="text-muted-foreground" />
                Lista Xtream
              </label>
              <select
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50"
                value={form.lista_id}
                onChange={(e) => setForm({ ...form, lista_id: e.target.value })}
              >
                <option value="">Selecionar...</option>
                {lists.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              Data de Vencimento
            </label>
            <input
              required
              type="date"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <FileText size={16} className="text-muted-foreground" />
              Observação (Opcional)
            </label>
            <textarea
              rows={2}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Ex: Pagamento via Pix"
              value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-border rounded-xl font-bold hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={activateMutation.isPending}
              className="flex-[2] px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {activateMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                "Ativar Dispositivo"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}