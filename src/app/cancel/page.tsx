// app/cancel/page.tsx
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { pickVariant } from '@/lib/ab';
import mainImg from '../../../public/img/main.jpg';

export default async function CancelPage() {
  const userId = MOCK_USER_ID;

  // 1) Latest subscription
  const { data: sub, error: subErr } = await supabaseAdmin
    .from('subscriptions')
    .select('id, monthly_price, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subErr) return <pre>Subscription error: {subErr.message}</pre>;
  if (!sub) return <p>No active subscription found.</p>;

  // 2) Existing cancellation row?
  const { data: existing, error: canErr } = await supabaseAdmin
    .from('cancellations')
    .select('id, downsell_variant')
    .eq('subscription_id', sub.id)
    .maybeSingle();

  if (canErr) return <pre>Cancellation lookup error: {canErr.message}</pre>;

  let variant: 'A' | 'B' = existing?.downsell_variant ?? pickVariant();

  // 3) First visit → insert + flip to pending
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
        .eq('status', 'active');
      if (upErr) return <pre>Update subscription error: {upErr.message}</pre>;
    }
  }

  // “Not yet” goes to offer only if Variant B
  const nextIfNo = variant === 'B' ? '/cancel/downsell' : '/cancel/reason';

  // --- Figma UI ---
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="text-sm">
              <a href="/" className="inline-flex items-center gap-1 text-gray-600 hover:underline">
                <span className="text-xl leading-none">&lsaquo;</span> Back
              </a>
            </div>
            <div className="text-sm font-medium text-gray-900">Subscription Cancellation</div>
            <div className="text-sm text-gray-500">×</div>
          </div>

          {/* Progress (Step 1/3) */}
          <div className="flex items-center justify-between px-6 pt-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-8 rounded bg-green-500" />
              <span className="h-2 w-8 rounded bg-gray-200" />
              <span className="h-2 w-8 rounded bg-gray-200" />
            </div>
            <div className="text-xs text-gray-600">Step 1 of 3</div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left copy */}
            <div className="order-2 lg:order-1 relative z-10">
              <h1 className="text-[28px] leading-tight font-semibold text-gray-900">
                Hey mate,
                <br />
                Quick one before you go.
              </h1>
              <p className="mt-3 text-[18px] italic font-medium text-gray-900">
                Have you found a job yet?
              </p>

              <p className="mt-3 text-sm text-gray-600 max-w-prose">
                Whatever your answer, we just want to help you take the next step.
                With visa support, or by hearing how we can do better.
              </p>

              <div className="mt-5 space-y-3">
                {/* “Yes” always → Reason */}
                <a
                  href="/cancel/reason"
                  className="block text-center w-full rounded-lg border border-gray-300 py-2 text-sm hover:bg-gray-50"
                >
                  Yes, I’ve found a job
                </a>

                {/* “Not yet” → Offer if B, else Reason */}
                <a
                  href={nextIfNo}
                  className="block text-center w-full rounded-lg border border-gray-300 py-2 text-sm hover:bg-gray-50"
                >
                  Not yet — I’m still looking
                </a>
              </div>
            </div>

            {/* Right image */}
            <div className="order-1 lg:order-2">
              <Image
                src={mainImg}
                alt="City skyline"
                className="w-full h-auto rounded-xl object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
