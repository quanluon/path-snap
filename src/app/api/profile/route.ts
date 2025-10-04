import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email } = await request.json();

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Name is too long (max 100 characters)' }, { status: 400 });
    }

    // Note: We can't update email through Supabase auth in server-side context
    // Email updates require special handling through Supabase Auth
    if (email && email !== user.email) {
      return NextResponse.json({ 
        error: 'Email updates are not supported. Please contact support.' 
      }, { status: 400 });
    }

    // Update user metadata (name)
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        name: name.trim(),
      },
    });

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          ...user.user_metadata,
          name: name.trim(),
        },
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
