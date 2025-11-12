// Executive board members who attend exec meetings
export const EXEC_MEMBER_NAMES = [
  'Mahi Ghia',
  'Rahul Nanda',
  'Sophie Liu',
  'Huixi Lee',
  'Arushi Gupta',
  'Edward Ke',
  'Allie Young',
  'Anusha Chatterjee',
  'Kit He',
  'Layla AlGhamdi',
  'Ash Barrett',
  'Quinn Kiefer',
];

export function isExecMember(memberName: string): boolean {
  return EXEC_MEMBER_NAMES.includes(memberName);
}

export function filterExecMembers<T extends { name: string }>(members: T[]): T[] {
  return members.filter(m => isExecMember(m.name));
}
