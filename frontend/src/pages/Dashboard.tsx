import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  LogOut,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  ShieldCheck,
  ArrowRight,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "DEVELOPER" | "PROGRAM_OFFICE" | "USER" | "STUDENT" | "FACULTY" | "TA" | "EXAM_OFFICE" | "SODOXO_OFFICE" | string;

interface Tile {
  title: string;
  description: string;
  icon: React.ElementType;
  role: AppRole | AppRole[];
}

// Icon Mapping


const tiles: Tile[] = [
  {
    title: "Onboard Batch",
    description: "Create and manage academic batches for incoming cohorts.",
    icon: Users,
    role: ["PROGRAM_OFFICE", "DEVELOPER"],
  },
  {
    title: "Manage Courses",
    description: "Configure courses, assign divisions, and set schedules.",
    icon: BookOpen,
    role: ["PROGRAM_OFFICE", "DEVELOPER"],
  },
  {
    title: "Attendance Hub",
    description: "Upload attendance, view reports, and flag low performers.",
    icon: BarChart3,
    role: ["PROGRAM_OFFICE", "DEVELOPER"],
  },
  {
    title: "System Settings",
    description: "Manage roles, platform configuration, and integrations.",
    icon: Users,
    role: "PROGRAM_OFFICE",
  },
  {
    title: "Request Access",
    description: "Apply for additional permissions.",
    icon: ShieldCheck,
    role: ["USER", "NEW_USER"], // Visible to USER and NEW_USER
  },
  {
    title: "Request History",
    description: "View status of your submitted requests.",
    icon: Clock,
    role: ["USER", "NEW_USER"], // Visible to USER and NEW_USER
  }
];

export default function Dashboard() {
  const { user, role, signOut, setRole } = useAuth();
  const navigate = useNavigate();
  const [availableRoles, setAvailableRoles] = React.useState<string[]>([]);

  React.useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from("t101_application_roles")
          .select("role_name");

        if (error) {
          console.error("Error fetching roles:", error);
          // Fallback to hardcoded roles if DB fetch fails or table doesn't exist yet
          setAvailableRoles(["DEVELOPER", "PROGRAM_OFFICE", "STUDENT", "USER", "FACULTY", "TA", "EXAM_OFFICE", "SODOXO_OFFICE"]);
        } else if (data) {
          // Normalize roles to Uppercase for comparison consistency
          const roles = data.map((r: { role_name: string }) => r.role_name.toUpperCase());
          // Ensure basic roles are present if table is empty/partial
          const defaultRoles = ["DEVELOPER", "USER"];
          const mergedRoles = Array.from(new Set([...defaultRoles, ...roles]));
          setAvailableRoles(mergedRoles);
        }
      } catch (err) {
        console.error("Unexpected error fetching roles:", err);
        setAvailableRoles(["DEVELOPER", "PROGRAM_OFFICE", "STUDENT", "USER", "FACULTY", "TA", "EXAM_OFFICE", "SODOXO_OFFICE"]);
      }
    };

    fetchRoles();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const visibleTiles = tiles.filter((tile) => {
    if (!role) return false;
    if (Array.isArray(tile.role)) {
      return tile.role.includes(role);
    }
    return tile.role === role;
  });

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const roleLabel = role ? role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, " ") : "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <img
                src="/cc-logo.png"
                alt="Classroom Companion Logo"
                className="h-9 w-9 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0 flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              SPJIMR Classroom Companion
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Role Switcher for Dev/Testing */}
            <div className="hidden md:flex items-center gap-2 mr-4">
              <span className="text-xs text-muted-foreground">View as:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={role?.toUpperCase() || ""}
                onChange={(e) => {
                  const newRole = e.target.value.toUpperCase() as AppRole;
                  setRole(newRole);
                }}
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0) + r.slice(1).toLowerCase().replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Welcome */}
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight">
              Welcome, {displayName}
            </h1>
            <p className="text-muted-foreground mt-1">
              {visibleTiles.length > 0
                ? "Select a module below to get started."
                : "Your dashboard will be populated as modules are assigned to your role."}
            </p>
          </div>

          {/* Tiles */}
          {visibleTiles.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleTiles.map((tile, i) => (
                <motion.div
                  key={tile.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  onClick={() => {
                    if (tile.title === "Request Access") {
                      navigate("/request-access");
                    } else if (tile.title === "Request History") {
                      navigate("/request-history");
                    }
                  }}
                >
                  <Card className="group cursor-pointer border-border/60 hover:border-accent hover:bg-accent hover:shadow-lg transition-all duration-200 h-full relative overflow-hidden">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary/10 group-hover:bg-white/20 transition-colors">
                          <tile.icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-white transition-colors" />
                      </div>

                      <div>
                        <h3 className="font-semibold font-display group-hover:text-white transition-colors">{tile.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-white/90 transition-colors mt-2">
                          {tile.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center space-y-3">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold font-display">
                  No modules available yet
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Your account has a <strong>{roleLabel}</strong> role.
                  Modules will appear here as they are configured by the
                  Program Office or system administrators.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}
