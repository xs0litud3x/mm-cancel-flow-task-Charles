// src/app/cancel/reason/ReasonForm.tsx
'use client';

import { useState } from 'react';
import CsrfField from '@/components/CsrfField';

type Props = { saveAction: (formData: FormData) => void };

export default function ReasonForm({ saveAction }: Props) {
  const [choice, setChoice] = useState<'visa_yes' | 'visa_no' | ''>('');
  const [visaType, setVisaType] = useState('');

  const canSubmit = choice !== '' && visaType.trim().length > 0;
  const label =
    choice === 'visa_no'
      ? "We can connect you with one of our trusted partners. Which visa would you like to apply for?*"
      : "What visa will you be applying for?*";

  return (
    <form action={saveAction} className="space-y-5">
      <CsrfField />

      <fieldset className="space-y-3">
        <legend className="sr-only">Is your company providing an immigration lawyer?</legend>

        <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
          <input
            type="radio"
            name="reason"
            value="visa_yes"
            checked={choice === 'visa_yes'}
            onChange={() => setChoice('visa_yes')}
            className="h-4 w-4"
            required
          />
          <span>Yes</span>
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
          <input
            type="radio"
            name="reason"
            value="visa_no"
            checked={choice === 'visa_no'}
            onChange={() => setChoice('visa_no')}
            className="h-4 w-4"
            required
          />
          <span>No</span>
        </label>
      </fieldset>

      {choice && (
        <div className="space-y-1">
          <label htmlFor="reason_details" className="text-sm text-gray-700">
            {label}
          </label>
          <input
            id="reason_details"
            name="reason_details"
            type="text"
            maxLength={500}
            value={visaType}
            onChange={(e) => setVisaType(e.target.value)}
            placeholder="Enter visa type…"
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8952fc] focus:border-[#8952fc]"
            required
          />
          <p className="text-xs text-gray-500">{500 - visaType.length} characters left</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <a href="/cancel" className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
          Back
        </a>

        <button
          type="submit"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          className={
            'px-4 py-2 rounded-md text-sm transition ' +
            (canSubmit
              ? 'bg-[#8952fc] text-white hover:bg-[#7b40fc]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed')
          }
        >
          Complete cancellation
        </button>
      </div>
    </form>
  );
}
