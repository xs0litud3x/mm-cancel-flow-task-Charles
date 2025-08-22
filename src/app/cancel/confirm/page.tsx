// src/app/cancel/confirm/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Image from 'next/image';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function nice(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function ConfirmPage() {
  const userId = MOCK_USER_ID;

  // Latest subscription
  const { data: sub, error: subErr } = await supabaseAdmin
    .from('subscriptions')
    .select('id, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subErr) {
    return (
      <main className="p-6">
        <pre className="text-sm text-red-600">Subscription error: {subErr.message}</pre>
      </main>
    );
  }
  if (!sub) return redirect('/cancel');

  // Ensure there is a cancellation row
  const { data: can } = await supabaseAdmin
    .from('cancellations')
    .select('id')
    .eq('subscription_id', sub.id)
    .maybeSingle();

  if (!can) return redirect('/cancel');

  // Finalize the subscription as cancelled (idempotent)
  if (sub.status !== 'cancelled') {
    await supabaseAdmin.from('subscriptions').update({ status: 'cancelled' }).eq('id', sub.id);
  }

  // We don’t have a billing period end in this schema, so estimate:
  //   end = created_at + 30 days (dev-only placeholder)
  const createdAt = sub.created_at ? new Date(sub.created_at as unknown as string) : new Date();
  const endDate = nice(addDays(createdAt, 30));

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="text-sm text-gray-600">
              <a href="/cancel" className="inline-flex items-center gap-1 hover:underline">
                <span className="text-xl leading-none">&lsaquo;</span> Back
              </a>
            </div>
            <div className="text-sm font-medium text-gray-900">Subscription Cancelled</div>
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <span className="inline-flex h-2 w-8 rounded bg-green-500" />
              <span className="inline-flex h-2 w-8 rounded bg-green-500" />
              <span className="inline-flex h-2 w-8 rounded bg-green-500" />
              <span className="ml-2">Completed</span>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left copy */}
            <div className="space-y-4">
              <h1 className="text-[28px] lg:text-[30px] font-semibold text-gray-900">
                Sorry to see you go, mate.
              </h1>

              <p className="text-sm text-gray-700 leading-6">
                Thanks for being with us, and you’re always welcome back.
              </p>

              <div className="text-sm text-gray-700 leading-6">
                <p className="font-medium">
                  Your subscription is set to end on <span className="underline">{endDate}</span>.
                </p>
                <p className="mt-2">
                  You’ll still have full access until then. No further charges after that.
                </p>
                <p className="mt-2">
                  Changed your mind? You can reactivate anytime before your end date.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="/jobs"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#8952fc] hover:bg-[#7b40fc] text-white text-sm"
                >
                  Back to Jobs
                </a>
              </div>
            </div>

            {/* Right image */}
            <div>
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



