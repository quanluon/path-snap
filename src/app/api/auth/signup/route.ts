import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/signup
 * Register a new user with Supabase Auth and create user record in database
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign up with Supabase Auth (auto-confirm enabled)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation
        data: {
          name: name || null,
        }
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user record in database
    await db.insert(users).values({
      id: authData.user.id,
      email,
      name: name || null,
      avatarUrl: null,
    });

    // Auto-login the user after successful signup
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Auto-login error:', signInError);
      // Still return success for signup, but user will need to login manually
      return NextResponse.json(
        {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name,
          },
          message: 'Account created successfully. Please login.',
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: signInData.user?.id || authData.user.id,
          email: signInData.user?.email || authData.user.email,
          name,
        },
        session: signInData.session,
        message: 'Account created and logged in successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


