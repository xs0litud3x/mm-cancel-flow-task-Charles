// src/app/cancel/downsell/page.tsx
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import CsrfField from '@/components/CsrfField';
import mainImg from '../../../../public/img/main.jpg';

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

async function acceptOffer(formData: FormData) {
  'use server';
  const csrf = String(formData.get('csrf') || '');
  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');

  const userId = MOCK_USER_ID;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, monthly_price')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) throw new Error('Subscription not found');

  const { data: can } = await supabaseAdmin
    .from('cancellations')
    .select('id, downsell_variant')
    .eq('subscription_id', sub.id)
    .maybeSingle();
  if (!can) throw new Error('Cancellation row missing');

  // mark acceptance (no payment processing)
  await supabaseAdmin
    .from('cancellations')
    .update({ accepted_downsell: true })
    .eq('id', can.id);

  // 👉 simplified route (avoid the nested /downsell/accepted page)
  redirect('/cancel/accepted');
}

async function declineOffer(formData: FormData) {
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

  if (can) {
    await supabaseAdmin
      .from('cancellations')
      .update({ accepted_downsell: false })
      .eq('id', can.id);
  }

  redirect('/cancel/confirm');
}

export default async function DownsellPage() {
  const userId = MOCK_USER_ID;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, monthly_price')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) return <main className="p-6">No subscription.</main>;

  const { data: can } = await supabaseAdmin
    .from('cancellations')
    .select('id, downsell_variant')
    .eq('subscription_id', sub.id)
    .maybeSingle();
  if (!can) return redirect('/cancel/reason');
  if (can.downsell_variant !== 'B') return redirect('/cancel/confirm');

  const base = sub.monthly_price;
  const offer = Math.max(0, base - 1000); // $10 off

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
            <div className="text-sm font-medium text-gray-900">Subscription Cancellation</div>
            <div className="text-sm text-gray-500">×</div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div className="order-2 lg:order-1">
              <h1 className="text-[22px] lg:text-[24px] font-semibold text-gray-900">
                We built this to help you land the job,
                <br className="hidden lg:block" /> this makes it a little easier.
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                We’ve been there and we’re here to help you.
              </p>

              <div className="mt-4 rounded-lg border border-purple-200 p-4">
                <div className="text-[14px] font-semibold">Here’s $10 off until you find a job.</div>
                <div className="text-sm text-gray-700">
                  {dollars(offer)}/month{' '}
                  <span className="text-gray-400 line-through ml-1">{dollars(base)}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <form action={acceptOffer}>
                  <CsrfField />
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#52d07b] text-white text-sm hover:opacity-90"
                  >
                    Get $10 off
                  </button>
                </form>

                <form action={declineOffer}>
                  <CsrfField />
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                  >
                    No thanks
                  </button>
                </form>
              </div>
            </div>

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
