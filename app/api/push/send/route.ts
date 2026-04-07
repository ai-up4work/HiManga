import { NextRequest } from 'next/server';
import webPush from 'web-push';

export async function POST(req: NextRequest) {
  const { title, body, url } = await req.json();
  
  // Get subscriptions from DB
  const subscriptions = []; // Your DB query
  
  const payload = JSON.stringify({ title, body, url: url || '/' });
  
  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(sub, payload);
    } catch (e) {
      // Remove expired subscription
    }
  }
  
  return Response.json({ sent: subscriptions.length });
}