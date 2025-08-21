// app/cancel/downsell/page.tsx
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import CsrfField from '@/components/CsrfField';
import { redirect } from 'next/navigation';

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

// Server Actions
async function acceptOffer(formData: FormData) {
  'use server';

  const csrf = String(formData.get('csrf') || '');
  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');

  const userId = MOCK_USER_ID;

  // Latest subscription for this user
  const { data: sub, error: subErr } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subErr || !sub) throw new Error(subErr?.message || 'Subscription not found');

  // Existing cancellation row
  const { data: can, error: canErr } = await supabaseAdmin
    .from('cancellations')
    .select('id')
    .eq('subscription_id', sub.id)
    .maybeSingle();
  if (canErr || !can) throw new Error(canErr?.message || 'Cancellation row missing');

  // Log accepted downsell
  const { error: upCanErr } = await supabaseAdmin
    .from('cancellations')
    .update({ accepted_downsell: true })
    .eq('id', can.id);
  if (upCanErr) throw new Error(upCanErr.message);

  // Keep subscription active (no real payment, per spec)
  const { error: upSubErr } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('id', sub.id);
  if (upSubErr) throw new Error(upSubErr.message);

  // Back to profile
  redirect('/');
}

async function declineOffer(formData: FormData) {
  'use server';

  const csrf = String(formData.get('csrf') || '');
  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');

  redirect('/cancel/confirm');
}

export default async function DownsellPage() {
  const userId = MOCK_USER_ID;

  // Load subscription
  const { data: sub, error: subErr } = await supabaseAdmin
    .from('subscriptions')
    .select('id, monthly_price')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subErr || !sub) return <p>Subscription not found.</p>;

  // Load cancellation & ensure this is Variant B
  const { data: can, error: canErr } = await supabaseAdmin
    .from('cancellations')
    .select('downsell_variant')
    .eq('subscription_id', sub.id)
    .maybeSingle();
  if (canErr || !can) return <p>Cancellation row missing.</p>;

  if (can.downsell_variant !== 'B') {
    // If user isn’t B, send them to confirm
    redirect('/cancel/confirm');
  }

  const offer = Math.max(0, sub.monthly_price - 1000);

  return (
    <main className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Special offer to stay</h1>
      <p>
        Your current plan is <b>{dollars(sub.monthly_price)}</b>. Keep Migrate Mate for{' '}
        <b>{dollars(offer)}</b> / month (–$10).
      </p>

      <div className="flex gap-3">
        <form action={acceptOffer}>
          <CsrfField />
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-[#8952fc] text-white text-sm hover:bg-[#7b40fc]"
          >
            Accept offer
          </button>
        </form>

        <form action={declineOffer}>
          <CsrfField />
          <button
            type="submit"
            className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
          >
            No thanks
          </button>
        </form>
      </div>

      <p className="text-xs text-gray-500">
        Payment processing is out of scope for this task—we just record acceptance and keep your
        subscription active.
      </p>
    </main>
  );
}
