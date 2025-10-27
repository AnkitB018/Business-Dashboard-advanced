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
  check_in_time: string;
  check_out_time: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day';
  overtime_hours: number;
  notes: string;
}

// Attendance data model matching Python Attendance class
export interface Attendance {
  _id?: string;
  attendance_id: string;
  employee_id: string;
  employee_name: string;
  date: Date;
  check_in_time: string;
  check_out_time?: string;
  working_hours?: number;
  overtime_hours?: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day';
  notes?: string;
  created_date: Date;
  last_modified: Date;
}

// Note: AttendanceModel class removed to avoid conflicts with simplified Attendance interface
// The AttendanceManagement component uses the simplified Attendance interface directly
