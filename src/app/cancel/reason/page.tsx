// src/app/cancel/reason/page.tsx
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';

export default async function ReasonRouterPage() {
  const userId = MOCK_USER_ID;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) return redirect('/cancel');

  const { data: can } = await supabaseAdmin
    .from('cancellations')
    .select('id, reason_details')
    .eq('subscription_id', sub.id)
    .maybeSingle();
  if (!can) return redirect('/cancel');

  const details = can.reason_details || '';

  // Find the LAST occurrence of withMM=(yes|no) and use that
  const matches = [...details.matchAll(/withMM=(yes|no)\b/gi)];
  const last = matches.length ? matches[matches.length - 1][1].toLowerCase() : null;
  const withMM = last === 'yes';

  return redirect(withMM ? '/cancel/reason/mm' : '/cancel/reason/nomm');
}

