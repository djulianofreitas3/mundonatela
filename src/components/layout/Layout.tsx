import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, Tv, Smartphone, Clock, History, Settings, Shield, LogOut, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


export function Layout({ children, title }: { children: React.ReactNode; title: string }) {
  const { data: stats } = useQuery({
    queryKey: ["support-stats"],
    queryFn: async () => {
      const { getSupportStats } = await import("@/lib/support.functions");
      return getSupportStats();
    },
    refetchInterval: 30000,
  });

  const menu = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Clientes", path: "/clientes", icon: Users },
    { name: "Listas Xtream", path: "/listas", icon: Tv },
    { name: "Dispositivos", path: "/dispositivos", icon: Smartphone },
    { name: "Ativações", path: "/ativacoes", icon: Clock },
    { 
      name: "Solicitações", 
      path: "/solicitacoes", 
      icon: Inbox,
      badge: stats?.new && stats.new > 0 ? stats.new : null 
    },
    { name: "Histórico", path: "/historico", icon: History },
    { name: "Administradores", path: "/admins", icon: Shield },
    { name: "Configurações", path: "/config", icon: Settings },
  ];

  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Você saiu do sistema");
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border bg-card hidden md:block flex flex-col">
        <div className="p-6 font-bold text-xl text-primary">Painel IPTV</div>
        <nav className="flex-1 mt-6 px-4 space-y-2">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center justify-between px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" as any }}
            >
              <div className="flex items-center space-x-3">
                <item.icon size={20} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-8 text-foreground">{title}</h1>
        {children}
      </main>
    </div>
  );
}
