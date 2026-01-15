import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Member ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Get member info before deleting (for photo cleanup)
    const { data: member } = await supabase
      .from('members')
      .select('name, photo_url')
      .eq('id', id)
      .single();

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Delete the member (cascades to attendance_records and point_history)
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    // If member had a photo in Supabase Storage, delete it
    if (member.photo_url && member.photo_url.includes('supabase.co/storage')) {
      const photoFileName = member.photo_url.split('/').pop();
      if (photoFileName) {
        await supabase.storage.from('photos').remove([photoFileName]);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${member.name} has been deleted`,
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}
