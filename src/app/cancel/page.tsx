// app/cancel/page.tsx
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { pickVariant } from '@/lib/ab';

export default async function CancelPage() {
  const userId = MOCK_USER_ID;

  // 1) Find the user's latest subscription
  const { data: sub, error: subErr } = await supabaseAdmin
    .from('subscriptions')
    .select('id, monthly_price, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subErr) return <pre>Subscription error: {subErr.message}</pre>;
  if (!sub) return <p>No active subscription found.</p>;

  // 2) Check existing cancellation row
  const { data: existing, error: canErr } = await supabaseAdmin
    .from('cancellations')
    .select('id, downsell_variant')
    .eq('subscription_id', sub.id)
    .maybeSingle();

  if (canErr) return <pre>Cancellation lookup error: {canErr.message}</pre>;

  let variant: 'A' | 'B' = existing?.downsell_variant ?? pickVariant();

  // 3) First visit → insert cancellation + flip to pending
  if (!existing) {
    const { error: insErr } = await supabaseAdmin.from('cancellations').insert([
      { user_id: userId, subscription_id: sub.id, downsell_variant: variant },
    ]);
    if (insErr) return <pre>Insert cancellation error: {insErr.message}</pre>;

    if (sub.status === 'active') {
      const { error: upErr } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'pending_cancellation' })
        .eq('id', sub.id)
        .eq('status', 'active'); // guard
      if (upErr) return <pre>Update subscription error: {upErr.message}</pre>;
    }
  }

  // 4) Compute downsell price if B ($10 off)
  const base = sub.monthly_price;
  const offer = variant === 'B' ? Math.max(0, base - 1000) : base;
  const dollars = (c: number) => `$${(c / 100).toFixed(2)}`;

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">Cancel (dev view)</h1>
      <div>Variant: <b>{variant}</b></div>
      <div>Plan: <b>{dollars(base)}</b></div>
      {variant === 'B' && <div>Downsell: <b>{dollars(offer)}</b> (–$10)</div>}
      <div>Status now: <b>{sub.status === 'active' ? 'active' : 'pending_cancellation'}</b></div>
      <p className="text-sm opacity-70">Reloading should not create new rows or change the variant.</p>
    </main>
  );
}
