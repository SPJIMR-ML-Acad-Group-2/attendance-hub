import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { AttendanceBadge } from "@/components/AttendanceBadge";
import { AttendanceBar } from "@/components/AttendanceBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, AlertTriangle, BarChart3, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentRecord {
  student_id: string;
  student_code: string;
  student_name: string;
  division: string;
  courses: {
    course_code: string;
    course_name: string;
    total: number;
    attended: number;
    percentage: number;
  }[];
  overall: number;
}

interface DivisionSummary {
  name: string;
  courses: { code: string; name: string; avg: number; students: number }[];
  avg: number;
}

export default function ProgramOfficeDashboard() {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [divisions, setDivisions] = useState<DivisionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Fetch all attendance with relations
    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("student_id, course_id, status, session_date, students(student_code, name, divisions(name)), courses(code, name)");

    if (!attendance || attendance.length === 0) {
      setLoading(false);
      return;
    }

    // Build student map
    const studentMap = new Map<string, StudentRecord>();
    const divMap = new Map<string, Map<string, { code: string; name: string; students: Set<string>; totalPct: number }>>();

    for (const r of attendance) {
      const stu = r.students as any;
      const crs = r.courses as any;
      const divName = stu.divisions?.name || "Unknown";
      const sid = r.student_id;

      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          student_id: sid,
          student_code: stu.student_code,
          student_name: stu.name,
          division: divName,
          courses: [],
          overall: 0,
        });
      }

      const student = studentMap.get(sid)!;
      let course = student.courses.find((c) => c.course_code === crs.code);
      if (!course) {
        course = { course_code: crs.code, course_name: crs.name, total: 0, attended: 0, percentage: 0 };
        student.courses.push(course);
      }
      course.total++;
      if (r.status === "Present") course.attended++;
    }

    // Compute percentages
    const studentList: StudentRecord[] = [];
    for (const s of studentMap.values()) {
      let totalSes = 0, totalAtt = 0;
      for (const c of s.courses) {
        c.percentage = c.total > 0 ? (c.attended / c.total) * 100 : 0;
        totalSes += c.total;
        totalAtt += c.attended;
      }
      s.overall = totalSes > 0 ? (totalAtt / totalSes) * 100 : 0;
      studentList.push(s);

      // Division aggregation
      if (!divMap.has(s.division)) divMap.set(s.division, new Map());
      const divCourses = divMap.get(s.division)!;
      for (const c of s.courses) {
        if (!divCourses.has(c.course_code)) {
          divCourses.set(c.course_code, { code: c.course_code, name: c.course_name, students: new Set(), totalPct: 0 });
        }
        const dc = divCourses.get(c.course_code)!;
        dc.students.add(s.student_id);
        dc.totalPct += c.percentage;
      }
    }

    // Build division summaries
    const divList: DivisionSummary[] = [];
    for (const [name, coursesMap] of divMap) {
      const courses = Array.from(coursesMap.values()).map((c) => ({
        code: c.code,
        name: c.name,
        avg: c.students.size > 0 ? c.totalPct / c.students.size : 0,
        students: c.students.size,
      }));
      const avg = courses.length > 0 ? courses.reduce((s, c) => s + c.avg, 0) / courses.length : 0;
      divList.push({ name, courses, avg });
    }

    setRecords(studentList);
    setDivisions(divList);
    setLoading(false);
  };

  const allDivisionNames = useMemo(() => [...new Set(records.map((r) => r.division))].sort(), [records]);
  const allCourses = useMemo(() => {
    const set = new Map<string, string>();
    records.forEach((r) => r.courses.forEach((c) => set.set(c.course_code, c.course_name)));
    return Array.from(set.entries()).map(([code, name]) => ({ code, name }));
  }, [records]);

  const filteredStudents = useMemo(() => {
    return records.filter((r) => {
      if (divisionFilter !== "all" && r.division !== divisionFilter) return false;
      if (courseFilter !== "all" && !r.courses.some((c) => c.course_code === courseFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.student_code.toLowerCase().includes(q) && !r.student_name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [records, divisionFilter, courseFilter, searchQuery]);

  const totalStudents = records.length;
  const lowAttStudents = records.filter((r) => r.overall < 75).length;
  const avgAttendance = totalStudents > 0 ? records.reduce((s, r) => s + r.overall, 0) / totalStudents : 0;

  const chartData = divisions.map((d) => ({ name: d.name, attendance: Math.round(d.avg * 10) / 10 }));

  if (loading) {
    return (
      <DashboardLayout title="Program Office Dashboard">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Program Office Dashboard" subtitle="Comprehensive attendance overview">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard title="Total Students" value={totalStudents} icon={Users} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard title="Average Attendance" value={`${avgAttendance.toFixed(1)}%`} icon={BarChart3} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard title="Total Courses" value={allCourses.length} icon={BookOpen} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard
            title="Below Threshold"
            value={lowAttStudents}
            description="Students below 75%"
            icon={AlertTriangle}
            iconClassName={lowAttStudents > 0 ? "text-status-danger" : ""}
          />
        </motion.div>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList>
          <TabsTrigger value="students">Student View</TabsTrigger>
          <TabsTrigger value="divisions">Division View</TabsTrigger>
        </TabsList>

        {/* Student View */}
        <TabsContent value="students" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Student ID or Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {allDivisionNames.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {allCourses.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Student table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((s) => (
                      <TableRow key={s.student_id} className={s.overall < 75 ? "bg-status-danger/5" : ""}>
                        <TableCell className="font-mono text-sm">{s.student_code}</TableCell>
                        <TableCell className="font-medium">{s.student_name}</TableCell>
                        <TableCell>{s.division}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {s.courses
                              .filter((c) => courseFilter === "all" || c.course_code === courseFilter)
                              .map((c) => (
                                <div key={c.course_code} className="flex items-center gap-2 text-xs">
                                  <span className="w-16 font-mono">{c.course_code}</span>
                                  <AttendanceBar percentage={c.percentage} height={6} />
                                  <span className="w-12 text-right">{c.percentage.toFixed(0)}%</span>
                                </div>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <AttendanceBar percentage={s.overall} />
                        </TableCell>
                        <TableCell className="text-right">
                          <AttendanceBadge percentage={s.overall} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Division View */}
        <TabsContent value="divisions" className="space-y-6">
          {/* Division chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Division-wise Average Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Division cards */}
          {divisions.map((div) => (
            <Card key={div.name}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display">{div.name}</CardTitle>
                <AttendanceBadge percentage={div.avg} />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead>Avg Attendance</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {div.courses.map((c) => (
                      <TableRow key={c.code}>
                        <TableCell className="font-mono">{c.code}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell className="text-center">{c.students}</TableCell>
                        <TableCell>
                          <AttendanceBar percentage={c.avg} />
                        </TableCell>
                        <TableCell className="text-right">
                          <AttendanceBadge percentage={c.avg} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
