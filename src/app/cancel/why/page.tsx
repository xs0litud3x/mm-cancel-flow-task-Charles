// src/app/cancel/why/page.tsx
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import CsrfField from '@/components/CsrfField';

const REASONS = [
  { id: 'too_expensive', label: 'Too expensive' },
  { id: 'platform_not_helpful', label: 'Platform not helpful' },
  { id: 'not_enough_jobs', label: 'Not enough relevant jobs' },
  { id: 'decided_not_to_move', label: 'Decided not to move' },
  { id: 'other', label: 'Other' },
];

function dollars(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
function sanitize(s: string, max = 500) {
  const safe = s.replace(/[<>&"`]/g, '');
  return safe.length > max ? safe.slice(0, max) : safe;
}

/** Green button: user changes mind and accepts the offer */
async function acceptOffer(formData: FormData) {
  'use server';
  const csrf = String(formData.get('csrf') || '');
  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');

  const userId = MOCK_USER_ID;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) throw new Error('Subscription not found');

  const { data: can } = await supabaseAdmin
    .from('cancellations')
    .select('id')
    .eq('subscription_id', sub.id)
    .maybeSingle();
  if (!can) throw new Error('Cancellation row missing');

  await supabaseAdmin
    .from('cancellations')
    .update({ accepted_downsell: true })
    .eq('id', can.id);

  redirect('/cancel/accepted');
}

/** Gray button: complete cancellation, persist reason + details */
async function complete(formData: FormData) {
  'use server';
  const csrf = String(formData.get('csrf') || '');
  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');

  const userId = MOCK_USER_ID;
  const reason = String(formData.get('reason') || '');
  const details = sanitize(String(formData.get('details') || ''));

  if (!REASONS.some(r => r.id === reason)) {
    // ensure a reason was selected
    redirect('/cancel/why?err=reason');
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) throw new Error('Subscription not found');

  const { data: can } = await supabaseAdmin
    .from('cancellations')
    .select('id')
    .eq('subscription_id', sub.id)
    .maybeSingle();
  if (!can) throw new Error('Cancellation row missing');

  await supabaseAdmin
    .from('cancellations')
    .update({ reason, reason_details: details || null, accepted_downsell: false })
    .eq('id', can.id);

  // Final screen
  redirect('/cancel/confirm');
}

export default async function WhyPage() {
  const userId = MOCK_USER_ID;

  // guards: only visit if there is an active cancellation flow
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, monthly_price')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) return redirect('/cancel');

  const { data: can } = await supabaseAdmin
    .from('cancellations')
    .select('id, downsell_variant, accepted_downsell')
    .eq('subscription_id', sub.id)
    .maybeSingle();

  if (!can) return redirect('/cancel/reason');         // didn’t start yet
  if (can.accepted_downsell) return redirect('/cancel/accepted');

  const base = sub.monthly_price;
  const offer = Math.max(0, base - 1000);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="text-sm text-gray-600">
              <a href="/cancel/usage" className="inline-flex items-center gap-1 hover:underline">
                <span className="text-xl leading-none">&lsaquo;</span> Back
              </a>
            </div>
            <div className="text-sm font-medium text-gray-900">Subscription Cancellation</div>
            <div className="text-sm text-gray-500">×</div>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between px-6 pt-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-8 rounded bg-green-500" />
              <span className="h-2 w-8 rounded bg-green-500" />
              <span className="h-2 w-8 rounded bg-green-500" />
            </div>
            <div className="text-xs text-gray-600">Step 3 of 3</div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left: reasons form */}
            <div className="order-2 lg:order-1">
              <h1 className="text-[22px] lg:text-[24px] font-semibold text-gray-900">
                What’s the main reason for cancelling?
              </h1>
              <p className="mt-1 text-sm text-gray-700">
                Please take a minute to let us know why:
              </p>

              <form action={complete} className="mt-6 space-y-5">
                <CsrfField />

                <fieldset className="space-y-2">
                  {REASONS.map(r => (
                    <label key={r.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={r.id}
                        className="h-4 w-4"
                        required
                      />
                      <span className="text-sm text-gray-900">{r.label}</span>
                    </label>
                  ))}
                </fieldset>

                {/* Free text (we keep it always visible to keep implementation simple) */}
                <div className="mt-3">
                  <label className="block text-sm text-gray-700 mb-1">
                    Add more detail (optional)
                  </label>
                  <textarea
                    name="details"
                    rows={4}
                    className="w-full rounded-md border border-gray-300 p-3 text-sm"
                    placeholder="What can we change to make the platform more helpful?"
                  />
                  <p className="text-xs text-gray-400 mt-1">Min 25 characters suggested (optional)</p>
                </div>

                {/* CTA row */}
                <div className="flex flex-col gap-3 pt-2">
                  {/* Green: second-chance discount */}
                  <form action={acceptOffer}>
                    <CsrfField />
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#52d07b] text-white text-sm hover:opacity-90"
                    >
                      Get 50% off | {dollars(offer)}
                    </button>
                  </form>

                  {/* Gray: complete cancellation */}
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                  >
                    Complete cancellation
                  </button>
                </div>
              </form>
            </div>

            {/* Right: image */}
            <div className="order-1 lg:order-2">
              <Image
                src="/img/main.jpg"
                alt="City skyline"
                width={768}
                height={512}
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
