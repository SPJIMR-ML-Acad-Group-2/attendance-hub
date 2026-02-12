import { getAttendanceColor } from "@/lib/attendance";

interface AttendanceBarProps {
  percentage: number;
  height?: number;
}

export function AttendanceBar({ percentage, height = 8 }: AttendanceBarProps) {
  const color = getAttendanceColor(percentage);
  const colorMap = {
    good: "bg-status-good",
    warning: "bg-status-warning",
    danger: "bg-status-danger",
  };

  return (
    <div className="w-full rounded-full bg-muted overflow-hidden" style={{ height }}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorMap[color]}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}
