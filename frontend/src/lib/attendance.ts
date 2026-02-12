export function getAttendanceColor(percentage: number): string {
  if (percentage >= 75) return "good";
  if (percentage >= 65) return "warning";
  return "danger";
}

export function getAttendanceBadgeClass(percentage: number): string {
  if (percentage >= 75) return "attendance-good";
  if (percentage >= 65) return "attendance-warning";
  return "attendance-danger";
}

export function getAttendanceTextClass(percentage: number): string {
  if (percentage >= 75) return "text-good";
  if (percentage >= 65) return "text-warning";
  return "text-danger";
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
