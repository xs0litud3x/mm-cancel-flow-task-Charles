'use client';

import { useState } from 'react';
import CsrfField from '@/components/CsrfField';

export default function VisaForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const [val, setVal] = useState<'visa_yes' | 'visa_no' | ''>('');
  const [text, setText] = useState('');

  const showText = !!val;
  const isNo = val === 'visa_no';
  const label = isNo
    ? 'Which visa would you like to apply for?'
    : 'What visa will you be applying for?';

  return (
    <form action={action} className="mt-6 space-y-5">
      <CsrfField />

      <fieldset>
        <label className="block text-sm text-gray-700 mb-2">
          Is your company providing an immigration lawyer to help with your visa?
        </label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reason"
              value="visa_yes"
              checked={val === 'visa_yes'}
              onChange={() => setVal('visa_yes')}
              className="h-4 w-4"
            />
            <span className="text-sm">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reason"
              value="visa_no"
              checked={val === 'visa_no'}
              onChange={() => setVal('visa_no')}
              className="h-4 w-4"
            />
            <span className="text-sm">No</span>
          </label>
        </div>
      </fieldset>

      {showText && (
        <div>
          {isNo && (
            <p className="text-sm text-gray-700 mb-2">
              We can connect you with one of our trusted partners.
            </p>
          )}
          <label className="block text-sm text-gray-700 mb-1">{label}</label>
          <input
            name="visa_text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Skilled Independent (subclass 189)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8952fc] focus:border-[#8952fc]"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!val}
        className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm
          ${val ? 'border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
        `}
      >
        Complete cancellation
      </button>
    </form>
  );
}

