// app/cancel/reason/page.tsx
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import CsrfField from '@/components/CsrfField';
import { redirect } from 'next/navigation';

const ALLOWED = new Set(['too_expensive', 'not_using', 'technical', 'other']);

function sanitizeDetails(input: string, max = 500) {
  const safe = input.replace(/[<>&"`]/g, '');
  return safe.length > max ? safe.slice(0, max) : safe;
}

async function saveReason(formData: FormData) {
  'use server';

  const userId = MOCK_USER_ID;
  const reason = String(formData.get('reason') || '');
  const reasonDetailsRaw = String(formData.get('reason_details') || '');
  const csrf = String(formData.get('csrf') || '');

  if (!verifyCsrfToken(csrf)) throw new Error('Invalid CSRF token');
  if (!ALLOWED.has(reason)) throw new Error('Invalid reason');

  const reason_details =
    reason === 'other' && reasonDetailsRaw ? sanitizeDetails(reasonDetailsRaw) : null;

  const { data: sub, error: subErr } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subErr || !sub) throw new Error(subErr?.message || 'Subscription not found');

  const { data: can, error: canErr } = await supabaseAdmin
    .from('cancellations')
    .select('id, downsell_variant')
    .eq('subscription_id', sub.id)
    .maybeSingle();
  if (canErr || !can) throw new Error(canErr?.message || 'Cancellation row missing');

  const { error: upErr } = await supabaseAdmin
    .from('cancellations')
    .update({ reason, reason_details })
    .eq('id', can.id);
  if (upErr) throw new Error(upErr.message);

  if (can.downsell_variant === 'B') {
    redirect('/cancel/downsell');
  } else {
    redirect('/cancel/confirm');
  }
}

export default async function ReasonPage() {
  return (
    <main className="p-6 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-semibold">Why are you canceling?</h1>

      <form action={saveReason} className="space-y-5">
        <CsrfField />

        <fieldset className="space-y-3">
          {/* radio options */}
          <label className="flex items-center gap-2">
            <input type="radio" name="reason" value="too_expensive" required />
            <span>It’s too expensive</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="reason" value="not_using" />
            <span>I’m not using it enough</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="reason" value="technical" />
            <span>I had technical issues</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="reason" value="other" />
            <span>Other</span>
          </label>
        </fieldset>

        <div className="space-y-1">
          <label htmlFor="reason_details" className="text-sm text-gray-700">
            (Optional) Add details
          </label>
          <textarea
            id="reason_details"
            name="reason_details"
            rows={4}
            className="w-full rounded-md border border-gray-300 p-2"
            placeholder="Tell us more…"
            maxLength={500}
          />
          <p className="text-xs text-gray-500">Max 500 characters. Ignored unless “Other” is selected.</p>
        </div>

        <div className="flex gap-3">
          <a href="/cancel" className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">
            Back
          </a>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-[#8952fc] text-white text-sm hover:bg-[#7b40fc]"
          >
            Continue
          </button>
        </div>
      </form>
    </main>
  );
}

