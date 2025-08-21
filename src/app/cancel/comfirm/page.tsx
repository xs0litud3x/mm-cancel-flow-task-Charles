import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_USER_ID } from '@/lib/mockUser';
import { verifyCsrfToken } from '@/lib/csrf';
import CsrfField from '@/components/CsrfField';
import { redirect } from 'next/navigation';

// ... confirmCancel (unchanged except calling verifyCsrfToken)

export default async function ConfirmPage() {
  return (
    <main className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Confirm cancellation</h1>
      <p>Are you sure you want to cancel your subscription?</p>

      <form action={confirmCancel} className="flex gap-3">
        <CsrfField />
        <a href="/cancel/reason" className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">
          Back
        </a>
        <button type="submit" className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700">
          Confirm cancel
        </button>
      </form>
    </main>
  );
}
