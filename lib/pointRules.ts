import { AttendanceStatus } from '@/types';

export interface EventTypeRules {
  absent: number;
  excused_absent: number;
  late: number;
  excused_late: number;
  present: number;
  inactive: number;
}

export const EVENT_TYPES = {
  ACTIVE_MEETING: 'Active Meeting',
  EXEC_MEETING: 'Exec Meeting',
  SOCIAL_EVENT: 'Social Event',
  CUSTOM: 'Custom Event',
};

// Point rules for different event types
export const POINT_RULES: Record<string, EventTypeRules> = {
  [EVENT_TYPES.ACTIVE_MEETING]: {
    absent: -5,
    excused_absent: -1,
    late: -2,
    excused_late: -1,
    present: 0,
    inactive: 0,
  },
  [EVENT_TYPES.EXEC_MEETING]: {
    absent: -5,
    excused_absent: -1,
    late: -2,
    excused_late: -1,
    present: 0,
    inactive: 0,
  },
  [EVENT_TYPES.SOCIAL_EVENT]: {
    // Social events use custom points per event
    absent: 0,
    excused_absent: 0,
    late: 0,
    excused_late: 0,
    present: 0, // Will be set dynamically
    inactive: 0,
  },
};

export const calculatePointChange = (
  eventType: string,
  status: AttendanceStatus
): number => {
  const rules = POINT_RULES[eventType] || POINT_RULES[EVENT_TYPES.ACTIVE_MEETING];
  return rules[status] || 0;
};

export const getStatusLabel = (status: AttendanceStatus): string => {
  const labels: Record<AttendanceStatus, string> = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused_absent: 'Excused Absent',
    excused_late: 'Excused Late',
    inactive: 'INACTIVE',
  };
  return labels[status];
};
