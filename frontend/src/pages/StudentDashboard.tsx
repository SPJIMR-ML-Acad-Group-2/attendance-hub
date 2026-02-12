import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { AttendanceBadge } from "@/components/AttendanceBadge";
import { AttendanceBar } from "@/components/AttendanceBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, BarChart3, AlertTriangle, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseAttendance {
  course_code: string;
  course_name: string;
  total_sessions: number;
  attended: number;
  percentage: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    if (!user) return;
    loadAttendance();
  }, [user]);

  const loadAttendance = async () => {
    // Get student linked to this user
    const { data: student } = await supabase
      .from("students")
      .select("id, name")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (!student) {
      setLoading(false);
      return;
    }

    setStudentName(student.name);

    // Get all attendance records for this student
    const { data: records } = await supabase
      .from("attendance_records")
      .select("course_id, status, courses(code, name)")
      .eq("student_id", student.id);

    if (!records || records.length === 0) {
      setLoading(false);
      return;
    }

    // Aggregate per course
    const courseMap = new Map<string, { code: string; name: string; total: number; attended: number }>();
    for (const r of records) {
      const course = r.courses as any;
      const key = r.course_id;
      if (!courseMap.has(key)) {
        courseMap.set(key, { code: course.code, name: course.name, total: 0, attended: 0 });
      }
      const entry = courseMap.get(key)!;
      entry.total++;
      if (r.status === "Present") entry.attended++;
    }

    const courseList: CourseAttendance[] = Array.from(courseMap.values()).map((c) => ({
      course_code: c.code,
      course_name: c.name,
      total_sessions: c.total,
      attended: c.attended,
      percentage: c.total > 0 ? (c.attended / c.total) * 100 : 0,
    }));

    setCourses(courseList);
    setLoading(false);
  };

  const totalSessions = courses.reduce((s, c) => s + c.total_sessions, 0);
  const totalAttended = courses.reduce((s, c) => s + c.attended, 0);
  const overallPercentage = totalSessions > 0 ? (totalAttended / totalSessions) * 100 : 0;
  const lowCourses = courses.filter((c) => c.percentage < 75).length;

  const pieData = [
    { name: "Present", value: totalAttended },
    { name: "Absent", value: totalSessions - totalAttended },
  ];
  const PIE_COLORS = ["hsl(152, 60%, 42%)", "hsl(0, 72%, 51%)"];

  if (loading) {
    return (
      <DashboardLayout title="My Attendance">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (courses.length === 0) {
    return (
      <DashboardLayout title="My Attendance" subtitle={`Welcome, ${studentName || "Student"}`}>
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No attendance data yet</h3>
            <p className="text-muted-foreground mt-1">Your attendance records will appear here once uploaded by the Program Office.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Attendance" subtitle={`Welcome back, ${studentName}`}>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard title="Overall Attendance" value={`${overallPercentage.toFixed(1)}%`} icon={BarChart3} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard title="Courses Enrolled" value={courses.length} icon={BookOpen} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard title="Sessions Attended" value={`${totalAttended}/${totalSessions}`} icon={CheckCircle} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard
            title="Low Attendance Courses"
            value={lowCourses}
            description={lowCourses > 0 ? "Below 75% threshold" : "All good!"}
            icon={AlertTriangle}
            iconClassName={lowCourses > 0 ? "text-status-danger" : ""}
          />
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Course-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Sessions</TableHead>
                  <TableHead className="text-center">Attended</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{c.course_code}</div>
                        <div className="text-xs text-muted-foreground">{c.course_name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{c.total_sessions}</TableCell>
                    <TableCell className="text-center">{c.attended}</TableCell>
                    <TableCell className="min-w-[120px]">
                      <AttendanceBar percentage={c.percentage} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AttendanceBadge percentage={c.percentage} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-status-good" /> Present
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-status-danger" /> Absent
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
