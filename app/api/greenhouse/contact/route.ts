import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId, message } = await req.json();
  if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 });

  // Fetch listing to verify it's active and get founder info
  const { data: listing } = await supabase
    .from('greenhouse_listings')
    .select('id, brand_name, user_id, status')
    .eq('id', listingId)
    .eq('status', 'active')
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: 'Listing not found or inactive' }, { status: 404 });

  // Prevent founder from contacting themselves
  if (listing.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot contact your own listing' }, { status: 400 });
  }

  // Upsert contact request (idempotent)
  const { data: contactReq, error: reqErr } = await supabase
    .from('greenhouse_contact_requests')
    .upsert({
      listing_id: listingId,
      requester_id: user.id,
      message: message?.trim() || null,
      status: 'pending',
    }, { onConflict: 'listing_id,requester_id' })
    .select()
    .maybeSingle();

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });

  // Increment contact_requests counter on listing (best-effort)
  try {
    const { data: listingRow } = await supabase
      .from('greenhouse_listings')
      .select('contact_requests')
      .eq('id', listingId)
      .maybeSingle();
    if (listingRow) {
      await supabase
        .from('greenhouse_listings')
        .update({ contact_requests: (listingRow.contact_requests ?? 0) + 1 })
        .eq('id', listingId);
    }
  } catch {
    // non-critical, ignore
  }

  return NextResponse.json({ success: true, request: contactReq });
}
