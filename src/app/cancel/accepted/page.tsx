// app/cancel/accepted/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
// one level deeper than /cancel, so 4 dots to reach project root
import mainImg from '../../../../public/img/main.jpg';

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AcceptedPage() {
  const userId = MOCK_USER_ID;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, monthly_price')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const base = sub?.monthly_price ?? 0;
  const offer = Math.max(0, base - 1000); // $10 off per spec

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
            <div className="text-sm font-medium text-gray-900">Subscription</div>
            <div className="text-sm text-gray-500">×</div>
          </div>

          {/* Progress (Completed) */}
          <div className="flex items-center justify-between px-6 pt-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-8 rounded bg-green-500" />
              <span className="h-2 w-8 rounded bg-green-500" />
              <span className="h-2 w-8 rounded bg-green-500" />
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div className="order-2 lg:order-1">
              <h1 className="text-[28px] leading-tight font-semibold text-gray-900">
                Great choice, mate!
              </h1>
              <p className="mt-2 text-gray-700">
                You’re still on the path to your dream role.{' '}
                <span className="font-medium">Let’s make it happen together!</span>
              </p>

              <div className="mt-4 text-sm text-gray-700 space-y-1">
                <p>
                  We’ve applied your new rate of{' '}
                  <span className="font-semibold">{dollars(offer)}/month</span>
                  {base ? <> (was {dollars(base)})</> : null}.
                </p>
                <p>You can cancel anytime before your next bill.</p>
              </div>

              <div className="mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2 rounded-lg bg-[#8952fc] text-white text-sm hover:bg-[#7b40fc]"
                >
                  Land your dream role
                </Link>
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
