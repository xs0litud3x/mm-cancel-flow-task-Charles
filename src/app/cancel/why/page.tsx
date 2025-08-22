// src/app/cancel/why/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Image from 'next/image';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import CsrfField from '@/components/CsrfField';

type BucketA = '0' | '1-5' | '6-20' | '20+';
type BucketB = '0' | '1-2' | '3-5' | '5-8' | '8+';

async function saveWhy(formData: FormData) {
  'use server';
  const csrf = String(formData.get('csrf') || '');
  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');

  const userId = MOCK_USER_ID;

  const found_mm = String(formData.get('found_mm') || '');
  const roles = String(formData.get('roles') || '0');
  const emails = String(formData.get('emails') || '0');
  const interviews = String(formData.get('interviews') || '0');

  const yesNo = new Set(['yes', 'no']);
  const bucketA = new Set(['0', '1-5', '6-20', '20+']);
  const bucketB = new Set(['0', '1-2', '3-5', '5-8', '8+']);
  if (!yesNo.has(found_mm)) throw new Error('Please choose Yes or No');

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

  const safeRoles: BucketA = (bucketA.has(roles) ? roles : '0') as BucketA;
  const safeEmails: BucketA = (bucketA.has(emails) ? emails : '0') as BucketA;
  const safeInterviews: BucketB = (bucketB.has(interviews) ? interviews : '0') as BucketB;

  const summary =
    `found_via_mm=${found_mm}; roles_applied=${safeRoles}; emails_direct=${safeEmails}; interviews=${safeInterviews}`;

  await supabaseAdmin
    .from('cancellations')
    .update({ reason: 'found_job', reason_details: summary })
    .eq('id', can.id);

  // Next step (visa question)
  redirect('/cancel/reason');
}

export default async function WhyPage() {
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

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left */}
            <div className="order-2 lg:order-1">
              <h1 className="text-[22px] lg:text-[24px] font-semibold text-gray-900">
                Congrats on the job! 🎉
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                A couple quick questions to help us understand what worked:
              </p>

              <form action={saveWhy} className="mt-6 space-y-6">
                <CsrfField />

                {/* Found job via MM? */}
                <fieldset>
                  <label className="block text-sm text-gray-700 mb-2">
                    Did you find your job through Migrate Mate?
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="found_mm" value="yes" className="h-4 w-4" required />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="found_mm" value="no" className="h-4 w-4" required />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </fieldset>

                {/* Roles applied via MM */}
                <fieldset>
                  <label className="block text-sm text-gray-700 mb-2">
                    How many roles did you apply for through Migrate Mate?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['0','1-5','6-20','20+'].map(v => (
                      <label key={v} className="cursor-pointer">
                        <input type="radio" name="roles" value={v} className="peer sr-only" defaultChecked={v==='0'} />
                        <div className="text-center text-sm py-2 rounded-md border bg-gray-50 peer-checked:bg-[#8952fc] peer-checked:text-white peer-checked:border-[#8952fc]">
                          {v}
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Companies emailed directly */}
                <fieldset>
                  <label className="block text-sm text-gray-700 mb-2">
                    How many companies did you email directly?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['0','1-5','6-20','20+'].map(v => (
                      <label key={v} className="cursor-pointer">
                        <input type="radio" name="emails" value={v} className="peer sr-only" defaultChecked={v==='0'} />
                        <div className="text-center text-sm py-2 rounded-md border bg-gray-50 peer-checked:bg-[#8952fc] peer-checked:text-white peer-checked:border-[#8952fc]">
                          {v}
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Interviews */}
                <fieldset>
                  <label className="block text-sm text-gray-700 mb-2">
                    How many different companies did you interview with?
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {['0','1-2','3-5','5-8','8+'].map(v => (
                      <label key={v} className="cursor-pointer">
                        <input type="radio" name="interviews" value={v} className="peer sr-only" defaultChecked={v==='0'} />
                        <div className="text-center text-sm py-2 rounded-md border bg-gray-50 peer-checked:bg-[#8952fc] peer-checked:text-white peer-checked:border-[#8952fc]">
                          {v}
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                >
                  Continue
                </button>
              </form>
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
