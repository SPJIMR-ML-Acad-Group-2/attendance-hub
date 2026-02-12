import { Badge } from "@/components/ui/badge";
import { getAttendanceBadgeClass, formatPercentage } from "@/lib/attendance";

interface AttendanceBadgeProps {
  percentage: number;
  className?: string;
}

export function AttendanceBadge({ percentage, className }: AttendanceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getAttendanceBadgeClass(percentage)} ${className ?? ""}`}
    >
      {formatPercentage(percentage)}
    </span>
  );
}
