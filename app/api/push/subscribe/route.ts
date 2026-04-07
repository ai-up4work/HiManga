import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';

webPush.setVapidDetails(
  'mailto:your@email.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const subscription = await req.json();
  
  // Save to DB with user ID (from session/cookies)
  // await db.user.update({ data: { pushSubscription: subscription } });
  
  return NextResponse.json({ success: true });
}