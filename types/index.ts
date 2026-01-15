export type MemberStatus = 'active' | 'inactive';

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'excused_absent'
  | 'excused_late'
  | 'inactive';

export interface Member {
  id: string;
  name: string;
  points: number;
  status: MemberStatus;
  rank_change: number;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  event_type: string;
  date: string;
  created_at: string;
  is_draft: boolean;
  is_reverted: boolean;
  custom_rules?: Partial<Record<AttendanceStatus, number>> | null;
  selected_members?: string[];
}

export interface AttendanceRecord {
  id: string;
  event_id: string;
  member_id: string;
  status: AttendanceStatus;
  points_change: number;
  created_at: string;
}

export interface PointHistory {
  id: string;
  member_id: string;
  event_id: string | null;
  points_change: number;
  reason: string;
  timestamp: string;
  member_name?: string;
  event_name?: string;
  new_total?: number;
}

export interface AttendanceSubmission {
  eventName: string;
  eventType: string;
  attendance: {
    memberId: string;
    status: AttendanceStatus;
  }[];
}

export interface PointAdjustment {
  memberId: string;
  pointsChange: number;
  reason: string;
}
