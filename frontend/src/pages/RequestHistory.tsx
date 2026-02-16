import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface RequestData {
    id: number;
    full_name: string;
    email: string;
    role_requested: string;
    submitted_at: string;
    status: string;
    details: any;
}

export default function RequestHistory() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [requests, setRequests] = useState<RequestData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from("t901_access_requests")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("submitted_at", { ascending: false });

                if (error) throw error;
                setRequests(data || []);
            } catch (error) {
                console.error("Error fetching requests:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case "APPROVED":
                return "text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-medium";
            case "REJECTED":
                return "text-destructive bg-red-100 px-2 py-1 rounded-full text-xs font-medium";
            default:
                return "text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/dashboard")}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-3xl font-display font-bold text-foreground">My Request History</h1>
                </div>

                <Card className="border-border/60 shadow-sm">
                    <CardHeader>
                        <CardTitle>Submitted Requests</CardTitle>
                        <CardDescription>
                            Track the status of your role access requests.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {requests.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No requests found.
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Role Requested</TableHead>
                                            <TableHead>Submitted Date</TableHead>
                                            <TableHead>Details</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.map((req) => (
                                            <TableRow key={req.id}>
                                                <TableCell className="font-medium">{req.role_requested}</TableCell>
                                                <TableCell>
                                                    {req.submitted_at ? format(new Date(req.submitted_at), "PPP p") : "-"}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate text-muted-foreground text-xs">
                                                    {/* Display key details based on role */}
                                                    {req.role_requested === "STUDENT" && req.details?.batch && `Batch: ${req.details.batch}`}
                                                    {req.role_requested === "FACULTY" && req.details?.specialization && `Spec: ${req.details.specialization}`}
                                                    {req.role_requested === "TA" && req.details?.facultyName && `Faculty: ${req.details.facultyName}`}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={getStatusColor(req.status)}>
                                                        {req.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
