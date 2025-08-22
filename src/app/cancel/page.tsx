// src/app/cancel/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Image from 'next/image';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import CsrfField from '@/components/CsrfField';

type CanRow = { id: string; downsell_variant: 'A' | 'B' };

// Create the cancellation row once and stick an A/B variant on it.
async function ensureCancellation(subscriptionId: string): Promise<CanRow> {
  const { data: existing } = await supabaseAdmin
    .from('cancellations')
    .select('id, downsell_variant')
    .eq('subscription_id', subscriptionId)
    .maybeSingle();

  if (existing) return existing as CanRow;

  const variant: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
  const { data, error } = await supabaseAdmin
    .from('cancellations')
    .insert({ subscription_id: subscriptionId, downsell_variant: variant })
    .select('id, downsell_variant')
    .single();

  if (error) throw new Error(error.message);
  return data as CanRow;
}

/** “Yes, I’ve found a job” → create row (if needed) then go to the job flow */
async function yesFoundJob(formData: FormData) {
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

  await ensureCancellation(sub.id);
  redirect('/cancel/job');
}

/** “Not yet — I’m still looking” → A/B: B=downsell, A=straight to confirm */
async function notYet(formData: FormData) {
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

  const can = await ensureCancellation(sub.id);

  if (can.downsell_variant === 'B') {
    redirect('/cancel/downsell');
  } else {
    redirect('/cancel/confirm');
  }
}

export default async function CancelPage() {
  const userId = MOCK_USER_ID;

  // Guard: needs an active subscription
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) {
    return (
      <main className="p-6">
        <p className="text-sm text-gray-700">No active subscription found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="text-sm text-gray-600">
              <a href="/" className="inline-flex items-center gap-1 hover:underline">
                <span className="text-xl leading-none">&lsaquo;</span> Back
              </a>
            </div>
            <div className="text-sm font-medium text-gray-900">Subscription Cancellation</div>
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <span className="inline-flex h-2 w-8 rounded bg-green-500" />
              <span className="inline-flex h-2 w-8 rounded bg-gray-200" />
              <span className="inline-flex h-2 w-8 rounded bg-gray-200" />
              <span className="ml-2">Step 1 of 3</span>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left content */}
            <div className="order-2 lg:order-1">
              <h1 className="text-[28px] lg:text-[30px] font-semibold text-gray-900">
                Hey mate, <br className="hidden lg:block" />
                Quick one before you go.
              </h1>
              <p className="mt-2 text-[18px] font-semibold text-gray-900">
                Have you found a job yet?
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Whatever your answer, we just want to help you take the next step. With visa
                support, or by hearing how we can do better.
              </p>

              <div className="mt-5 space-y-3">
                {/* Yes: found a job */}
                <form action={yesFoundJob}>
                  <CsrfField />
                  <button
                    type="submit"
                    className="block text-center w-full rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Yes, I’ve found a job
                  </button>
                </form>

                {/* Not yet */}
                <form action={notYet}>
                  <CsrfField />
                  <button
                    type="submit"
                    className="block text-center w-full rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Not yet — I’m still looking
                  </button>
                </form>
              </div>
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
