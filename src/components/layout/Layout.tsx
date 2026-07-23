import { Link, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Users, Tv, Smartphone, Clock, History, Settings, Shield } from "lucide-react";

export function Layout({ children, title }: { children: React.ReactNode; title: string }) {
  const menu = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Clientes", path: "/clientes", icon: Users },
    { name: "Listas Xtream", path: "/listas", icon: Tv },
    { name: "Dispositivos", path: "/dispositivos", icon: Smartphone },
    { name: "Ativações", path: "/ativacoes", icon: Clock },
    { name: "Histórico", path: "/historico", icon: History },
    { name: "Administradores", path: "/admins", icon: Shield },
    { name: "Configurações", path: "/config", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border bg-card hidden md:block">
        <div className="p-6 font-bold text-xl text-primary">Painel IPTV</div>
        <nav className="mt-6 px-4 space-y-2">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" }}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-8 text-foreground">{title}</h1>
        {children}
      </main>
    </div>
  );
}
