import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSettings, updateSettings } from '@/lib/ai-inbox';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * Schema for user profile
 */
const profileSchema = z.object({
  current_stack: z.array(z.string()).default([]),
  current_projects: z.array(z.string()).default([]),
  skill_level: z
    .enum(['beginner', 'intermediate', 'advanced'], {
      message: 'Skill level must be beginner, intermediate, or advanced',
    })
    .default('intermediate'),
  interests: z.array(z.string()).default([]),
});

/**
 * Schema for updating settings
 */
const updateSettingsSchema = z.object({
  profile: profileSchema,
});

/**
 * GET /api/ai-inbox/settings
 * Get user settings (creates default if none exists)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getSettings();

    if (!settings) {
      return NextResponse.json(
        { error: 'Failed to get settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    logger.error('[ai-inbox/settings] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ai-inbox/settings
 * Update user profile settings
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues
        .map((issue) => issue.message)
        .join(', ');
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { profile } = validation.data;
    const success = await updateSettings(profile);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    logger.log('[ai-inbox/settings] Updated settings for user');
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[ai-inbox/settings] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
