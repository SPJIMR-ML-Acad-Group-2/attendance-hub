import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ParsedRow {
  student_id: string;
  student_name: string;
  course_code: string;
  course_name: string;
  division: string;
  session_date: string;
  status: string;
}

type UploadStatus = "idle" | "parsing" | "validating" | "uploading" | "done" | "error";

const REQUIRED_COLUMNS = ["Student ID", "Student Name", "Course Code", "Course Name", "Division", "Session Date", "Attendance Status"];

export default function UploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [stats, setStats] = useState({ processed: 0, failed: 0 });
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    setFile(f);
    setStatus("idle");
    setErrors([]);
    setParsedRows([]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const parseAndValidate = async () => {
    if (!file) return;
    setStatus("parsing");
    setErrors([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      if (json.length === 0) {
        setErrors([{ row: 0, field: "File", message: "File is empty" }]);
        setStatus("error");
        return;
      }

      // Validate columns
      const headers = Object.keys(json[0]);
      const missingCols = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
      if (missingCols.length > 0) {
        setErrors(missingCols.map((c) => ({ row: 0, field: c, message: `Missing required column: ${c}` })));
        setStatus("error");
        return;
      }

      setStatus("validating");
      const validationErrors: ValidationError[] = [];
      const rows: ParsedRow[] = [];

      for (let i = 0; i < json.length; i++) {
        const r = json[i];
        const rowNum = i + 2; // Excel row (header is row 1)

        if (!r["Student ID"]?.toString().trim()) {
          validationErrors.push({ row: rowNum, field: "Student ID", message: "Student ID is required" });
        }
        if (!r["Student Name"]?.toString().trim()) {
          validationErrors.push({ row: rowNum, field: "Student Name", message: "Student Name is required" });
        }
        if (!r["Course Code"]?.toString().trim()) {
          validationErrors.push({ row: rowNum, field: "Course Code", message: "Course Code is required" });
        }
        if (!r["Course Name"]?.toString().trim()) {
          validationErrors.push({ row: rowNum, field: "Course Name", message: "Course Name is required" });
        }
        if (!r["Division"]?.toString().trim()) {
          validationErrors.push({ row: rowNum, field: "Division", message: "Division is required" });
        }

        const dateVal = r["Session Date"];
        let parsedDate = "";
        if (!dateVal) {
          validationErrors.push({ row: rowNum, field: "Session Date", message: "Session Date is required" });
        } else {
          // Handle Excel serial dates
          if (typeof dateVal === "number") {
            const d = XLSX.SSF.parse_date_code(dateVal);
            parsedDate = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
          } else {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) {
              validationErrors.push({ row: rowNum, field: "Session Date", message: "Invalid date format" });
            } else {
              parsedDate = d.toISOString().split("T")[0];
            }
          }
        }

        const statusVal = r["Attendance Status"]?.toString().trim();
        if (!statusVal || !["Present", "Absent"].includes(statusVal)) {
          validationErrors.push({ row: rowNum, field: "Attendance Status", message: 'Must be "Present" or "Absent"' });
        }

        if (validationErrors.filter((e) => e.row === rowNum).length === 0) {
          rows.push({
            student_id: r["Student ID"].toString().trim(),
            student_name: r["Student Name"].toString().trim(),
            course_code: r["Course Code"].toString().trim(),
            course_name: r["Course Name"].toString().trim(),
            division: r["Division"].toString().trim(),
            session_date: parsedDate,
            status: statusVal,
          });
        }
      }

      setParsedRows(rows);
      setErrors(validationErrors);

      if (validationErrors.length > 0 && rows.length === 0) {
        setStatus("error");
      } else {
        setStatus("validating");
      }
    } catch (err: any) {
      toast.error("Failed to parse file");
      setStatus("error");
    }
  };

  const uploadData = async () => {
    if (parsedRows.length === 0) return;
    setStatus("uploading");
    let processed = 0;
    let failed = 0;

    try {
      // Create upload log
      const { data: log } = await supabase
        .from("upload_logs")
        .insert({ filename: file!.name, uploaded_by: user!.id, rows_processed: 0, rows_failed: 0, status: "processing" })
        .select()
        .single();

      // Ensure divisions exist
      const divNames = [...new Set(parsedRows.map((r) => r.division))];
      for (const name of divNames) {
        await supabase.from("divisions").upsert({ name }, { onConflict: "name" });
      }

      // Fetch divisions
      const { data: divs } = await supabase.from("divisions").select("id, name");
      const divMap = new Map(divs?.map((d) => [d.name, d.id]) || []);

      // Ensure courses exist
      const courseKeys = [...new Set(parsedRows.map((r) => `${r.course_code}||${r.course_name}||${r.division}`))];
      for (const key of courseKeys) {
        const [code, name, div] = key.split("||");
        await supabase.from("courses").upsert({ code, name, division_id: divMap.get(div) }, { onConflict: "code" });
      }

      // Fetch courses
      const { data: courses } = await supabase.from("courses").select("id, code");
      const courseMap = new Map(courses?.map((c) => [c.code, c.id]) || []);

      // Ensure students exist
      const stuKeys = [...new Set(parsedRows.map((r) => `${r.student_id}||${r.student_name}||${r.division}`))];
      for (const key of stuKeys) {
        const [code, name, div] = key.split("||");
        await supabase
          .from("students")
          .upsert({ student_code: code, name, division_id: divMap.get(div) }, { onConflict: "student_code" });
      }

      // Fetch students
      const { data: students } = await supabase.from("students").select("id, student_code");
      const stuMap = new Map(students?.map((s) => [s.student_code, s.id]) || []);

      // Insert attendance records
      for (const row of parsedRows) {
        const studentDbId = stuMap.get(row.student_id);
        const courseDbId = courseMap.get(row.course_code);
        if (!studentDbId || !courseDbId) {
          failed++;
          continue;
        }
        const { error } = await supabase.from("attendance_records").upsert(
          {
            student_id: studentDbId,
            course_id: courseDbId,
            session_date: row.session_date,
            status: row.status,
          },
          { onConflict: "student_id,course_id,session_date" }
        );
        if (error) {
          failed++;
        } else {
          processed++;
        }
      }

      // Update log
      if (log) {
        await supabase
          .from("upload_logs")
          .update({ rows_processed: processed, rows_failed: failed, status: "completed" })
          .eq("id", log.id);
      }

      setStats({ processed, failed });
      setStatus("done");
      toast.success(`Upload complete: ${processed} records processed`);
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
      setStatus("error");
    }
  };

  return (
    <DashboardLayout title="Upload Attendance" subtitle="Upload Excel files with attendance data">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Drop zone */}
        <Card>
          <CardContent className="py-8">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              {file ? (
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Drop your Excel file here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse (.xlsx, .xls)</p>
                </div>
              )}
            </div>

            {file && status === "idle" && (
              <div className="mt-4 text-center">
                <Button onClick={parseAndValidate} className="gap-2">
                  <Upload className="w-4 h-4" /> Parse & Validate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Required format info */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Required Columns</CardTitle>
            <CardDescription>Your Excel file must contain these exact column headers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {REQUIRED_COLUMNS.map((col) => (
                <Badge key={col} variant="secondary" className="font-mono text-xs">
                  {col}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Validation errors */}
        {errors.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-status-danger/30">
              <CardHeader>
                <CardTitle className="font-display text-base flex items-center gap-2 text-status-danger">
                  <AlertCircle className="w-5 h-5" /> Validation Errors ({errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.map((e, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{e.row}</TableCell>
                          <TableCell>{e.field}</TableCell>
                          <TableCell className="text-status-danger">{e.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Ready to upload */}
        {status === "validating" && parsedRows.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="py-6 text-center">
                <CheckCircle className="w-10 h-10 mx-auto text-status-good mb-3" />
                <p className="font-medium">{parsedRows.length} valid rows ready to upload</p>
                {errors.length > 0 && (
                  <p className="text-sm text-muted-foreground">{errors.length} rows with errors will be skipped</p>
                )}
                <Button onClick={uploadData} className="mt-4 gap-2">
                  <Upload className="w-4 h-4" /> Upload {parsedRows.length} Records
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Uploading */}
        {status === "uploading" && (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary mb-3" />
              <p className="font-medium">Processing records...</p>
            </CardContent>
          </Card>
        )}

        {/* Done */}
        {status === "done" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-status-good/30">
              <CardContent className="py-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-status-good mb-3" />
                <p className="text-lg font-semibold">Upload Complete</p>
                <div className="flex justify-center gap-6 mt-3 text-sm">
                  <span className="text-status-good">{stats.processed} processed</span>
                  {stats.failed > 0 && <span className="text-status-danger">{stats.failed} failed</span>}
                </div>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setFile(null);
                    setStatus("idle");
                    setErrors([]);
                    setParsedRows([]);
                  }}
                >
                  Upload Another File
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
