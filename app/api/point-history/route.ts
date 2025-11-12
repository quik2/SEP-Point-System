import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('point_history')
      .select(`
        *,
        members!inner(name),
        events(name)
      `)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (memberId) {
      query = query.eq('member_id', memberId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Format the data
    const formattedData = data.map((record: any) => ({
      ...record,
      member_name: record.members?.name,
      event_name: record.events?.name || 'Manual Adjustment',
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
