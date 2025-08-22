// src/app/cancel/job/page.tsx
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import CsrfField from '@/components/CsrfField';

function sanitize(s: string, max = 300) {
  const safe = s.replace(/[<>&"`]/g, '');
  return safe.length > max ? safe.slice(0, max) : safe;
}

async function saveJobStep(formData: FormData) {
  'use server';
  const csrf = String(formData.get('csrf') || '');
  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');

  const withMM   = String(formData.get('with_mm') || '');        // yes | no
  const roles    = String(formData.get('roles') || '');          // 0 | 1-5 | 6-20 | 20+
  const emails   = String(formData.get('emails') || '');         // 0 | 1-5 | 6-20 | 20+
  const interviews = String(formData.get('interviews') || '');   // 0 | 1-2 | 3-5 | 5+

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
    .select('id, reason_details')
    .eq('subscription_id', sub.id)
    .maybeSingle();

  if (!can) return redirect('/cancel');

  // Build the fresh "found_job" note
  const freshNote = `found_job: withMM=${withMM}; roles=${roles}; emails=${emails}; interviews=${interviews}`;

  // Remove any previous "found_job: ..." segment from reason_details before appending the new one.
  // This avoids having both "...withMM=yes" and "...withMM=no" in the string.
  const prev = can.reason_details || '';
  const stripped = prev
    // remove any 'found_job: ...' segment (delimited by pipes or ends)
    .replace(/(?:^|\s*\|\s*)found_job:[^|]*/gi, '')
    .replace(/\s*\|\s*$/g, '')        // tidy trailing pipe
    .trim();

  const combined = stripped ? `${stripped} | ${sanitize(freshNote)}` : sanitize(freshNote);

  await supabaseAdmin
    .from('cancellations')
    .update({ reason: 'found_job', reason_details: combined })
    .eq('id', can.id);

  // Next step in the "found a job" path
  return redirect('/cancel/job/feedback');
}

export default async function JobFoundPage() {
  const userId = MOCK_USER_ID;

  // Guard: must have an active cancellation
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
              <a href="/cancel" className="inline-flex items-center gap-1 hover:underline">
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
            {/* Left: form */}
            <div className="order-2 lg:order-1">
              <h1 className="text-[22px] lg:text-[24px] font-semibold text-gray-900">
                Congrats on the new role! 🎉
              </h1>

              <form action={saveJobStep} className="mt-6 space-y-6">
                <CsrfField />

                {/* Q1: With MigrateMate? */}
                <fieldset>
                  <label className="block text-sm text-gray-700 mb-2">
                    Did you find this job with MigrateMate?*
                  </label>
                  <div className="flex items-center gap-4">
                    {['yes','no'].map(v => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="with_mm"
                          value={v}
                          className="h-4 w-4"
                          required
                        />
                        <span className="text-sm capitalize">{v}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Q2: roles applied */}
                <fieldset>
                  <label className="block text-sm text-gray-700 mb-2">
                    How many roles did you apply for through MigrateMate?*
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['0', '1-5', '6-20', '20+'].map(v => (
                      <label key={v} className="cursor-pointer">
                        <input type="radio" name="roles" value={v} className="peer sr-only" required />
                        <div className="text-center text-sm py-2 rounded-md border bg-gray-50 peer-checked:bg-[#8952fc] peer-checked:text-white peer-checked:border-[#8952fc]">
                          {v}
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Q3: emails direct */}
                <fieldset>
                  <label className="block text-sm text-gray-700 mb-2">
                    How many companies did you email directly?*
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['0', '1-5', '6-20', '20+'].map(v => (
                      <label key={v} className="cursor-pointer">
                        <input type="radio" name="emails" value={v} className="peer sr-only" required />
                        <div className="text-center text-sm py-2 rounded-md border bg-gray-50 peer-checked:bg-[#8952fc] peer-checked:text-white peer-checked:border-[#8952fc]">
                          {v}
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Q4: interviews */}
                <fieldset>
                  <label className="block text-sm text-gray-700 mb-2">
                    How many different companies did you interview with?*
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['0', '1-2', '3-5', '5+'].map(v => (
                      <label key={v} className="cursor-pointer">
                        <input type="radio" name="interviews" value={v} className="peer sr-only" required />
                        <div className="text-center text-sm py-2 rounded-md border bg-gray-50 peer-checked:bg-[#8952fc] peer-checked:text-white peer-checked:border-[#8952fc]">
                          {v}
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>

            {/* Right: image */}
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
