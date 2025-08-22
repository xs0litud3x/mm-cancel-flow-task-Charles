// src/app/cancel/job/feedback/page.tsx
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import FeedbackClient from './FeebackClient';

function sanitize(s: string, max = 500) {
  const safe = s.replace(/[<>&"`]/g, '');
  return safe.length > max ? safe.slice(0, max) : safe;
}

// --- server action ----------------------------------------------------------
async function saveFeedback(formData: FormData) {
  'use server';
  const csrf = String(formData.get('csrf') || '');
  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');

  const feedback = String(formData.get('feedback') || '');
  if (feedback.trim().length < 25) {
    return redirect('/cancel/job/feedback?err=min');
  }

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

  const combined =
    (can.reason_details ? can.reason_details + ' | ' : '') +
    `job_feedback=${sanitize(feedback)}`;

  await supabaseAdmin
    .from('cancellations')
    .update({ reason_details: combined })
    .eq('id', can.id);

  redirect('/cancel/reason');
}

// --- page (server) ----------------------------------------------------------
export default async function Page() {
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
    .select('id')
    .eq('subscription_id', sub.id)
    .maybeSingle();
  if (!can) return redirect('/cancel');

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="text-sm text-gray-600">
              <a href="/cancel/job" className="inline-flex items-center gap-1 hover:underline">
                <span className="text-xl leading-none">&lsaquo;</span> Back
              </a>
            </div>
            <div className="text-sm font-medium text-gray-900">Subscription Cancellation</div>
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <span className="inline-flex h-2 w-8 rounded bg-green-500" />
              <span className="inline-flex h-2 w-8 rounded bg-green-500" />
              <span className="inline-flex h-2 w-8 rounded bg-gray-200" />
              <span className="ml-2">Step 2 of 3</span>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left: client form */}
            <div className="order-2 lg:order-1">
              <h1 className="text-[22px] lg:text-[24px] font-semibold text-gray-900">
                What’s one thing you wish we could’ve helped you with?
              </h1>
              <p className="mt-1 text-sm text-gray-700">
                We’re always looking to improve—your thoughts can help us make Migrate Mate more useful for others.*
              </p>

              <FeedbackClient action={saveFeedback} />
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
