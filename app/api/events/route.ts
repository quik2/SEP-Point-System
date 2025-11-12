import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const includeDrafts = searchParams.get('includeDrafts') === 'true';

    // Get all events first, then filter in JavaScript to handle both boolean and string 'false'
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Events API error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Filter out drafts if needed (handle both boolean and string values)
    let filteredData = data || [];
    console.log('Total events from DB:', filteredData.length);
    console.log('Sample event is_draft values:', filteredData.slice(0, 3).map(e => ({ name: e.name, is_draft: e.is_draft, type: typeof e.is_draft })));

    if (!includeDrafts) {
      filteredData = filteredData.filter(event => {
        // Handle both boolean false and string 'false'
        const isDraft = event.is_draft;
        return isDraft === false || isDraft === 'false' || isDraft === null || isDraft === undefined;
      });
    }

    console.log('Filtered events (excluding drafts):', filteredData.length);
    return NextResponse.json({ success: true, data: filteredData });
  } catch (error: any) {
    console.error('Events API exception:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
