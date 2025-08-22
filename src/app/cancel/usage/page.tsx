// src/app/cancel/usage/page.tsx
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import ReasonClient from './ReasonClient';

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function sanitize(s: string, max = 500) {
  const safe = s.replace(/[<>&"`]/g, '');
  return safe.length > max ? safe.slice(0, max) : safe;
}

// --- Server actions ---------------------------------------------------------

// Green button: user changes mind and takes the discount
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

// Grey button: continue to final confirmation, store reason + details
async function continueCancel(formData: FormData) {
  'use server';
  const csrf = String(formData.get('csrf') || '');
  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');

  const userId = MOCK_USER_ID;

  const reason = String(formData.get('reason') || '');
  const detailsRaw = String(formData.get('details') || '');

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
    .update({
      accepted_downsell: false,
      reason,
      // for “too_expensive” we’ll save the number; for others we save the free text
      reason_details: sanitize(detailsRaw),
    })
    .eq('id', can.id);

  redirect('/cancel/confirm');
}

// --- Page (server) ----------------------------------------------------------

export default async function UsagePage() {
  const userId = MOCK_USER_ID;

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

  if (!can) return redirect('/cancel/reason');
  if (can.downsell_variant !== 'B') return redirect('/cancel/confirm');
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
              <a href="/cancel/downsell" className="inline-flex items-center gap-1 hover:underline">
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
            {/* Left column */}
            <div className="order-2 lg:order-1">
              <h1 className="text-[22px] lg:text-[24px] font-semibold text-gray-900">
                What’s the main reason for cancelling?
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Please take a minute to let us know why:
              </p>

              {/* Client form section */}
              <ReasonClient
                offer={offer}
                continueAction={continueCancel}
                acceptAction={acceptOffer}
              />
            </div>

            {/* Right image */}
            <div className="order-1 lg:order-2">
              <Image
                src="/img/main.jpg"
                alt="City skyline"
                width={800}
                height={600}
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
