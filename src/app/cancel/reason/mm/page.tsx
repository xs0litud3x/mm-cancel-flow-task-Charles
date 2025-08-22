import Image from 'next/image';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import VisaForm from './VisaForm';

// server action -> save and branch to final page
async function completeMM(formData: FormData) {
  'use server';
  const csrf = String(formData.get('csrf') || '');
  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');

  const reason = String(formData.get('reason') || ''); // 'visa_yes' | 'visa_no'
  const visaInfo = String(formData.get('visa_info') || '').replace(/[<>&"`]/g, '').slice(0, 200);

  if (reason !== 'visa_yes' && reason !== 'visa_no') throw new Error('Invalid reason');

  const userId = MOCK_USER_ID;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions').select('id').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!sub) return redirect('/cancel');

  const { data: can } = await supabaseAdmin
    .from('cancellations').select('id, reason_details')
    .eq('subscription_id', sub.id).maybeSingle();
  if (!can) return redirect('/cancel');

  const details = (can.reason_details ? can.reason_details + ' | ' : '') + `visa:${reason}; ${visaInfo}`;
  await supabaseAdmin.from('cancellations').update({
    reason,
    reason_details: visaInfo ? details : can.reason_details ?? null,
    accepted_downsell: false,
  }).eq('id', can.id);

  // Branch:
  // visa_yes  -> no extra help page
  // visa_no   -> help-with-visa page
  redirect(reason === 'visa_no' ? '/cancel/final/help' : '/cancel/final/none');
}

export default async function Page() {
  const userId = MOCK_USER_ID;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions').select('id').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!sub) return redirect('/cancel');

  const { data: can } = await supabaseAdmin
    .from('cancellations').select('id').eq('subscription_id', sub.id).maybeSingle();
  if (!can) return redirect('/cancel');

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="text-sm text-gray-600">
              <a href="/cancel/job/feedback" className="inline-flex items-center gap-1 hover:underline">
                <span className="text-xl leading-none">&lsaquo;</span> Back
              </a>
            </div>
            <div className="text-sm font-medium text-gray-900">Subscription Cancellation</div>
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <span className="inline-flex h-2 w-8 rounded bg-green-500" />
              <span className="inline-flex h-2 w-8 rounded bg-green-500" />
              <span className="inline-flex h-2 w-8 rounded bg-green-500" />
              <span className="ml-2">Step 3 of 3</span>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left */}
            <div>
              <h1 className="text-[22px] lg:text-[24px] font-semibold text-gray-900">
                We helped you land the job, now let’s help you secure your visa.
              </h1>

              <VisaForm
                action={completeMM}
                yesPrompt="What visa will you be applying for?"
                noPrompt="We can connect you with one of our trusted partners. Which visa would you like to apply for?"
              />
            </div>

            {/* Right image */}
            <div className="order-first lg:order-none">
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


