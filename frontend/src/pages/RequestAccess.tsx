import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type RequestRole = "STUDENT" | "FACULTY" | "TA" | "OTHER";

export default function RequestAccess() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<RequestRole | "">("");

    // Form States
    const [formData, setFormData] = useState({
        batch: "",
        rollNo: "",
        specialization: "",
        employeeId: "",
        facultyName: "",
        reason: ""
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role) {
            toast.error("Please select a role");
            return;
        }

        if (!user) {
            toast.error("You must be logged in to submit a request");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('t901_access_requests')
                .insert({
                    user_id: user.id,
                    full_name: user.user_metadata?.full_name || user.email || "Unknown",
                    email: user.email || "",
                    role_requested: role,
                    details: formData,
                    status: 'PENDING',
                    submitted_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success("Access request submitted successfully", {
                description: "You will be notified once the request is approved."
            });
            navigate("/dashboard");
        } catch (error: any) {
            console.error("Error submitting request:", error);
            toast.error("Failed to submit request", {
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-lg"
            >
                <Card className="border-border/60 shadow-lg">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate("/dashboard")}
                                className="h-8 w-8 -ml-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <CardTitle className="text-2xl font-display">Request Access</CardTitle>
                        </div>
                        <CardDescription>
                            Submit a request for additional role permissions.
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="role">I am a...</Label>
                                <Select
                                    value={role}
                                    onValueChange={(val) => setRole(val as RequestRole)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STUDENT">Student</SelectItem>
                                        <SelectItem value="FACULTY">Faculty</SelectItem>
                                        <SelectItem value="TA">Teaching Assistant (TA)</SelectItem>
                                        <SelectItem value="OTHER">Other / Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Conditional Fields */}
                            <motion.div
                                key={role}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4 overflow-hidden"
                            >
                                {role === "STUDENT" && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="batch">Batch (Year)</Label>
                                                <Input
                                                    id="batch"
                                                    placeholder="e.g. 2024-26"
                                                    value={formData.batch}
                                                    onChange={(e) => handleInputChange("batch", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rollNo">Roll No</Label>
                                                <Input
                                                    id="rollNo"
                                                    placeholder="e.g. PGP-123"
                                                    value={formData.rollNo}
                                                    onChange={(e) => handleInputChange("rollNo", e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="specialization">Specialization</Label>
                                            <Input
                                                id="specialization"
                                                placeholder="e.g. Finance, Marketing"
                                                value={formData.specialization}
                                                onChange={(e) => handleInputChange("specialization", e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                {role === "FACULTY" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="specialization">Specialization / Department</Label>
                                            <Input
                                                id="specialization"
                                                placeholder="e.g. Finance, Marketing"
                                                value={formData.specialization}
                                                onChange={(e) => handleInputChange("specialization", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="employeeId">Employee ID</Label>
                                            <Input
                                                id="employeeId"
                                                placeholder="e.g. SPJ-1001"
                                                value={formData.employeeId}
                                                onChange={(e) => handleInputChange("employeeId", e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                {role === "TA" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="specialization">Specialization</Label>
                                            <Input
                                                id="specialization"
                                                placeholder="e.g. Operations"
                                                value={formData.specialization}
                                                onChange={(e) => handleInputChange("specialization", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="facultyName">Faculty Name</Label>
                                            <Input
                                                id="facultyName"
                                                placeholder="e.g. Prof. Sharma"
                                                value={formData.facultyName}
                                                onChange={(e) => handleInputChange("facultyName", e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                            </motion.div>

                        </CardContent>

                        <CardFooter className="flex justify-between pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate("/dashboard")}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-primary text-primary-foreground hover:bg-accent hover:text-white transition-colors min-w-[120px]"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
