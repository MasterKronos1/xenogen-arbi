import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/user';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    const supabase = getSupabaseClient();

    // The Unified Signature: Architect + Aethel + Arbi
    // In this phase, we update the Architect Sig and set Committed to True
    const { data, error } = await supabase
      .from('sovereignty_ledger')
      .update({ 
        architect_sig: true, 
        is_committed: true,
        committed_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // TODO: Trigger the actual physical/digital action here 
    // based on the data.payload (e.g., Drone Launch, Database Wipe, etc.)

    return NextResponse.json({ status: 'COMMITTED_TO_TIMELINE', action: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
