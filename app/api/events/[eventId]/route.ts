import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

/**
 * DELETE /api/events/[eventId]
 *
 * Deletes a draft event and its attendance records
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const supabase = getServiceRoleClient();
    const { eventId } = await context.params;

    // Verify this is a draft event before deleting
    const { data: event } = await supabase
      .from('events')
      .select('is_draft, is_reverted')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!event.is_draft && !event.is_reverted) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete submitted events. Only drafts can be deleted.' },
        { status: 400 }
      );
    }

    // Delete the event (attendance records will cascade delete)
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Draft event deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
