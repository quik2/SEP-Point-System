// Airtable member name mapping service
// Handles flexible matching between Airtable person names and SEP member names

import { supabase } from './supabase';

export interface MemberMapping {
  id: string;
  airtable_person_name: string;
  member_id: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  name: string;
  points: number;
  status: string;
}

/**
 * Flexible name matching: checks if Airtable name is contained in member name (case-insensitive)
 * Examples:
 * - "quinn" matches "Quinn Kiefer"
 * - "Kit" matches "Kit Zeliff"
 * - "ash" matches "Ash Barrett"
 */
export function flexibleNameMatch(airtableName: string, memberName: string): boolean {
  const normalizedAirtable = airtableName.toLowerCase().trim();
  const normalizedMember = memberName.toLowerCase().trim();

  // Check if Airtable name is contained in member name
  if (normalizedMember.includes(normalizedAirtable)) {
    return true;
  }

  // Check if member name is contained in Airtable name
  if (normalizedAirtable.includes(normalizedMember)) {
    return true;
  }

  // Check first name match (split on space and compare first parts)
  const airtableFirst = normalizedAirtable.split(' ')[0];
  const memberFirst = normalizedMember.split(' ')[0];

  return airtableFirst === memberFirst;
}

/**
 * Find member ID for an Airtable person name
 * 1. First checks mapping table for existing mapping
 * 2. If not found, attempts flexible match against all members
 * 3. If match found, creates mapping for future use
 */
export async function findMemberIdForAirtablePerson(airtableName: string): Promise<string | null> {
  // Step 1: Check if mapping exists
  const { data: existingMapping } = await supabase
    .from('airtable_member_mapping')
    .select('member_id')
    .eq('airtable_person_name', airtableName)
    .single();

  if (existingMapping) {
    return existingMapping.member_id;
  }

  // Step 2: Fetch all members and attempt flexible match
  const { data: members, error } = await supabase
    .from('members')
    .select('id, name')
    .eq('status', 'active');

  if (error || !members) {
    console.error('Error fetching members:', error);
    return null;
  }

  // Find matching member
  const matchedMember = members.find(member =>
    flexibleNameMatch(airtableName, member.name)
  );

  if (!matchedMember) {
    console.warn(`No member found for Airtable person: ${airtableName}`);
    return null;
  }

  // Step 3: Create mapping for future use
  const { error: mappingError } = await supabase
    .from('airtable_member_mapping')
    .insert({
      airtable_person_name: airtableName,
      member_id: matchedMember.id,
      updated_at: new Date().toISOString()
    });

  if (mappingError) {
    console.error('Error creating mapping:', mappingError);
  }

  return matchedMember.id;
}

/**
 * Batch find member IDs for multiple Airtable person names
 */
export async function findMemberIdsForAirtablePersons(
  airtableNames: string[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const name of airtableNames) {
    const memberId = await findMemberIdForAirtablePerson(name);
    if (memberId) {
      results.set(name, memberId);
    }
  }

  return results;
}

/**
 * Get all existing mappings
 */
export async function getAllMappings(): Promise<MemberMapping[]> {
  const { data, error } = await supabase
    .from('airtable_member_mapping')
    .select('*')
    .order('airtable_person_name');

  if (error) {
    console.error('Error fetching mappings:', error);
    return [];
  }

  return data || [];
}

/**
 * Initialize mappings for all current Airtable persons
 * Useful for first-time setup
 */
export async function initializeAllMappings(airtablePersons: string[]): Promise<{
  success: number;
  failed: string[];
}> {
  const failed: string[] = [];
  let success = 0;

  for (const person of airtablePersons) {
    const memberId = await findMemberIdForAirtablePerson(person);
    if (memberId) {
      success++;
    } else {
      failed.push(person);
    }
  }

  return { success, failed };
}
