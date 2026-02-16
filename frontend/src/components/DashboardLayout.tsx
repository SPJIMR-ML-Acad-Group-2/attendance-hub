import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, LayoutDashboard, Upload, Users } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">AttendTrack</span>
            {role === "program_office" && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                Program Office
              </span>
            )}
          </div>

          <nav className="flex items-center gap-2">
            {role === "program_office" && (
              <>
                <Button variant="spjimr" size="sm" onClick={() => navigate("/")} className="gap-1.5">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Button>
                <Button variant="spjimr" size="sm" onClick={() => navigate("/upload")} className="gap-1.5">
                  <Upload className="w-4 h-4" /> Upload
                </Button>
                <Button variant="spjimr" size="sm" onClick={() => navigate("/students")} className="gap-1.5">
                  <Users className="w-4 h-4" /> Students
                </Button>
              </>
            )}
            <div className="h-6 w-px bg-border mx-1" />
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="spjimr" size="sm" onClick={handleSignOut} className="gap-1.5">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
