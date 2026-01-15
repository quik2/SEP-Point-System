import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const photo = formData.get('photo') as File;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo is required' },
        { status: 400 }
      );
    }

    const fullName = `${firstName} ${lastName}`;
    const supabase = getServiceRoleClient();

    // Check if member already exists
    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .ilike('name', fullName)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'A member with this name already exists' },
        { status: 400 }
      );
    }

    // Upload photo to Supabase Storage
    const photoFileName = `${firstName.toLowerCase()}-${Date.now()}.jpg`;
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(photoFileName, buffer, {
        contentType: photo.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload photo' },
        { status: 500 }
      );
    }

    // Get the public URL for the uploaded photo
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(photoFileName);

    const photoUrl = urlData.publicUrl;

    // Add member to database with 100 starting points and photo URL
    const { data: newMember, error: insertError } = await supabase
      .from('members')
      .insert({
        name: fullName,
        points: 100,
        status: 'active',
        rank_change: 0,
        photo_url: photoUrl,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newMember,
      message: `${fullName} has been added to the leaderboard`,
    });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add member' },
      { status: 500 }
    );
  }
}
