import Image from 'next/image';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';

export default async function Page() {
  const userId = MOCK_USER_ID;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions').select('id, status').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!sub) return redirect('/cancel');

  if (sub.status !== 'cancelled') {
    await supabaseAdmin.from('subscriptions').update({ status: 'cancelled' }).eq('id', sub.id);
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div />
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
            <div className="space-y-3">
              <h1 className="text-[22px] lg:text-[24px] font-semibold text-gray-900">
                Your cancellation’s all sorted, mate, no more charges.
              </h1>

              {/* helper card with avatar */}
              <div className="mt-3 flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                <Image
                  src="/img/profile.jpeg"  // make sure this file exists in public/img/
                  alt="Mekha Benson"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="text-sm text-gray-700">
                  <p className="font-medium">Mekha Benson</p>
                  <p className="mt-1">
                    I’ll be reaching out soon to help with the visa side of things.
                    We can get your docs together & questions answered, or just figure out your next steps.
                  </p>
                  <p className="mt-1 text-gray-500">Keep an eye on your inbox, I’ll be in touch shortly.</p>
                </div>
              </div>

              <a href="/jobs"
                 className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#8952fc] hover:bg-[#7b40fc] text-white text-sm">
                Finish
              </a>
            </div>

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
