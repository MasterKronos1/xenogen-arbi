import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    
    // Fetch actions that haven't been committed to the timeline yet
    const { data, error } = await supabase
      .from('sovereignty_ledger')
      .select('*')
      .eq('is_committed', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
