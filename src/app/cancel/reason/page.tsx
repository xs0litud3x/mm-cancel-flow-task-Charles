// app/cancel/reason/page.tsx
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import ReasonForm from './ReasonForm';

// ⬇️ static import (note extra ../ because file is deeper)
import mainImg from '../../../../public/img/main.jpg';

const ALLOWED = new Set(['visa_yes', 'visa_no']);

function sanitizeDetails(input: string, max = 500) {
  const safe = input.replace(/[<>&"`]/g, '');
  return safe.length > max ? safe.slice(0, max) : safe;
}

async function saveReason(formData: FormData) {
  'use server';
  const userId = MOCK_USER_ID;
  const reason = String(formData.get('reason') || '');
  const detailsRaw = String(formData.get('reason_details') || '');
  const csrf = String(formData.get('csrf') || '');

  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');
  if (!ALLOWED.has(reason)) throw new Error('Invalid reason');

  const reason_details = detailsRaw ? sanitizeDetails(detailsRaw) : null;

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
    .select('id, downsell_variant')
    .eq('subscription_id', sub.id)
    .maybeSingle();
  if (!can) throw new Error('Cancellation row missing');

  const { error: upErr } = await supabaseAdmin
    .from('cancellations')
    .update({ reason, reason_details })
    .eq('id', can.id);
  if (upErr) throw new Error(upErr.message);

  if (can.downsell_variant === 'B') {
    return redirect('/cancel/downsell');
  }
  return redirect('/cancel/confirm');
}

export default async function ReasonPage() {
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

          {/* Progress */}
          <div className="flex items-center justify-between px-6 pt-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-8 rounded bg-green-500" />
              <span className="h-2 w-8 rounded bg-green-500" />
              <span className="h-2 w-8 rounded bg-green-500" />
            </div>
            <div className="text-xs text-gray-600">Step 3 of 3</div>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div>
              <h1 className="text-3xl lg:text-[32px] font-semibold leading-tight text-gray-900">
                We helped you land the job, now
                <br />
                let’s help you secure your visa.
              </h1>

              <p className="mt-4 text-sm text-gray-700">
                Is your company providing an immigration lawyer to help with your visa?
              </p>

              <div className="mt-4">
                <ReasonForm saveAction={saveReason} />
              </div>
            </div>

            <div className="order-first lg:order-none">
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
