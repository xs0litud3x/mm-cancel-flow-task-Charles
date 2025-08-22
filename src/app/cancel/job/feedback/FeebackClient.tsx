'use client';

import { useMemo, useRef, useState } from 'react';
import CsrfField from '@/components/CsrfField';

export default function FeedbackClient({
  action,
}: {
  action: (fd: FormData) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [attempted, setAttempted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const tooShort = text.trim().length < 25;
  const canContinue = useMemo(() => !tooShort, [tooShort]);

  return (
    <form ref={formRef} action={action} className="mt-6 space-y-4">
      <CsrfField />

      {attempted && tooShort && (
        <p className="text-sm text-red-600">
          Please enter at least 25 characters so we can understand your feedback*
        </p>
      )}

      <div className="relative">
        <textarea
          name="feedback"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none
            ${attempted && tooShort ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-[#8952fc]'}
          `}
          placeholder="Type your feedback…"
        />
        <span
          className={`absolute right-2 bottom-2 text-[11px]
            ${attempted && tooShort ? 'text-red-600' : 'text-gray-400'}
          `}
        >
          Min 25 characters ({text.trim().length}/25)
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          setAttempted(true);
          if (canContinue) formRef.current?.requestSubmit();
        }}
        className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm
          ${canContinue ? 'border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
        `}
        disabled={!canContinue}
      >
        Continue
      </button>
    </form>
  );
}
