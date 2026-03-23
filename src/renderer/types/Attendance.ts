// Attendance status enum for type safety
export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LATE = 'Late',
  HALF_DAY = 'Half Day',
  HOLIDAY = 'Holiday',
  ON_LEAVE = 'Leave'
}

// Form data interface for attendance management
export interface AttendanceFormData {
  employee_id: string;
  time_in: string;
  time_out: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day';
  overtime_hour: number;
  notes: string;
}

// Attendance data model - consolidated interface
export interface Attendance {
  _id?: string;
  attendance_id: string;           // Format: {employee._id}-{YYYY-MM-DD}
  employee_id: string;              // References employee._id (NOT employee.employee_id)
  employee_name: string;
  date: Date;
  time_in: string;
  time_out?: string;
  break_time?: number;          // Break time in hours
  working_hours?: number;
  overtime_hour?: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Note: AttendanceModel class removed to avoid conflicts with simplified Attendance interface
// The AttendanceManagement component uses the simplified Attendance interface directly
