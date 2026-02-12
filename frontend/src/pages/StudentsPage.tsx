import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { AttendanceBadge } from "@/components/AttendanceBadge";
import { AttendanceBar } from "@/components/AttendanceBar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users as UsersIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentSummary {
  id: string;
  student_code: string;
  name: string;
  division: string;
  totalSessions: number;
  attended: number;
  percentage: number;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [divFilter, setDivFilter] = useState("all");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data: stuData } = await supabase
      .from("students")
      .select("id, student_code, name, divisions(name)");

    const { data: records } = await supabase
      .from("attendance_records")
      .select("student_id, status");

    if (!stuData) { setLoading(false); return; }

    const attMap = new Map<string, { total: number; attended: number }>();
    records?.forEach((r) => {
      if (!attMap.has(r.student_id)) attMap.set(r.student_id, { total: 0, attended: 0 });
      const e = attMap.get(r.student_id)!;
      e.total++;
      if (r.status === "Present") e.attended++;
    });

    const list: StudentSummary[] = stuData.map((s) => {
      const att = attMap.get(s.id) || { total: 0, attended: 0 };
      return {
        id: s.id,
        student_code: s.student_code,
        name: s.name,
        division: (s.divisions as any)?.name || "Unknown",
        totalSessions: att.total,
        attended: att.attended,
        percentage: att.total > 0 ? (att.attended / att.total) * 100 : 0,
      };
    });

    setStudents(list);
    setLoading(false);
  };

  const divNames = [...new Set(students.map((s) => s.division))].sort();
  const filtered = students.filter((s) => {
    if (divFilter !== "all" && s.division !== divFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.student_code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <DashboardLayout title="Students">
        <Skeleton className="h-96" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Students" subtitle={`${students.length} total students`}>
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID or Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={divFilter} onValueChange={setDivFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {divNames.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Division</TableHead>
                <TableHead className="text-center">Sessions</TableHead>
                <TableHead className="text-center">Attended</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id} className={s.percentage < 75 && s.totalSessions > 0 ? "bg-status-danger/5" : ""}>
                    <TableCell className="font-mono text-sm">{s.student_code}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.division}</TableCell>
                    <TableCell className="text-center">{s.totalSessions}</TableCell>
                    <TableCell className="text-center">{s.attended}</TableCell>
                    <TableCell className="min-w-[120px]">
                      <AttendanceBar percentage={s.percentage} />
                    </TableCell>
                    <TableCell className="text-right">
                      {s.totalSessions > 0 ? <AttendanceBadge percentage={s.percentage} /> : <span className="text-xs text-muted-foreground">N/A</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
