// src/app/cancel/reason/ReasonForm.tsx
import CsrfField from '@/components/CsrfField';

export default function ReasonForm({
  saveAction,
}: {
  saveAction: (fd: FormData) => Promise<void>;
}) {
  return (
    <form action={saveAction} className="mt-4 space-y-5">
      <CsrfField />

      <fieldset className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="reason" value="visa_yes" className="h-4 w-4" required />
          <span className="text-sm text-gray-900">Yes</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="reason" value="visa_no" className="h-4 w-4" required />
          <span className="text-sm text-gray-900">No</span>
        </label>
      </fieldset>

      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Add more detail (optional)
        </label>
        <textarea
          name="reason_details"
          rows={3}
          className="w-full rounded-md border border-gray-300 p-3 text-sm"
          placeholder="Anything we should know?"
        />
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
      >
        Complete cancellation
      </button>
    </form>
  );
}

