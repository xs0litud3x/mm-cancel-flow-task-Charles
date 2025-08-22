// src/app/cancel/usage/ReasonClient.tsx
'use client';

import { useMemo, useRef, useState } from 'react';
import CsrfField from '@/components/CsrfField';

type ReasonOption =
  | 'too_expensive'
  | 'platform_not_helpful'
  | 'not_enough_jobs'
  | 'decided_not_to_move'
  | 'other';

export default function ReasonClient(props: {
  offer: number;
  continueAction: (fd: FormData) => Promise<void>;
  acceptAction: (fd: FormData) => Promise<void>;
}) {
  const { offer, continueAction, acceptAction } = props;

  const [reason, setReason] = useState<ReasonOption | ''>('');
  const [details, setDetails] = useState('');
  const [attempted, setAttempted] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const needsDetails = reason !== '' && reason !== 'too_expensive';
  const detailsTooShort = needsDetails && details.trim().length < 25;

  const canContinue = useMemo(() => {
    if (!reason) return false;
    if (needsDetails) return !detailsTooShort;
    return true; // too_expensive path
  }, [reason, needsDetails, detailsTooShort]);

  function onContinueClick() {
    setAttempted(true);
    if (canContinue) formRef.current?.requestSubmit();
  }

  function dollars(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="mt-5">
      {/* Main form: radios + conditional detail + Continue */}
      <form ref={formRef} action={continueAction} className="space-y-5">
        <CsrfField />

        {/* Radios */}
        <fieldset>
          <legend className="sr-only">Main reason</legend>

          {!reason && attempted && (
            <p className="text-sm text-red-600 mb-2">
              To help us understand your experience, please select a reason for cancelling*
            </p>
          )}

          <div className="space-y-2">
            {(
              [
                ['too_expensive', 'Too expensive'],
                ['platform_not_helpful', 'Platform not helpful'],
                ['not_enough_jobs', 'Not enough relevant jobs'],
                ['decided_not_to_move', 'Decided not to move'],
                ['other', 'Other'],
              ] as [ReasonOption, string][]
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  value={value}
                  checked={reason === value}
                  onChange={(e) => {
                    setReason(e.target.value as ReasonOption);
                    setAttempted(false);
                    setDetails('');
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-900">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* “Too expensive” → price input */}
        {reason === 'too_expensive' && (
          <div className="mt-3">
            <label className="block text-sm text-gray-700 mb-2">
              What would be the maximum you would be willing to pay?*
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                name="details"
                inputMode="decimal"
                placeholder="e.g. 12.50"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8952fc] focus:border-[#8952fc]"
              />
            </div>
          </div>
        )}

        {/* Other reasons → textarea, min 25 chars */}
        {needsDetails && (
          <div className="mt-3">
            <label className="block text-sm text-gray-700 mb-1">
              {reason === 'platform_not_helpful'
                ? 'What can we change to make the platform more helpful?*'
                : 'In which way can we make things more relevant?*'}
            </label>

            {attempted && detailsTooShort && (
              <p className="text-sm text-red-600 mb-2">
                Please enter at least 25 characters so we can understand your feedback*
              </p>
            )}

            <div className="relative">
              <textarea
                name="details"
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none
                  ${attempted && detailsTooShort ? 'border-red-500' : 'border-gray-300'}
                  focus:ring-2 ${attempted && detailsTooShort ? 'focus:ring-red-500' : 'focus:ring-[#8952fc]'}
                `}
                placeholder="Type your feedback…"
              />
              <span
                className={`absolute right-2 bottom-2 text-[11px]
                  ${attempted && detailsTooShort ? 'text-red-600' : 'text-gray-400'}
                `}
              >
                Min 25 characters ({details.trim().length}/25)
              </span>
            </div>
          </div>
        )}

        {/* Continue (submits this form) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onContinueClick}
            disabled={!canContinue}
            className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm
              ${canContinue
                ? 'border border-gray-300 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            Complete cancellation
          </button>
        </div>
      </form>

      {/* Green button: separate form (no nesting!) */}
      <form action={acceptAction} className="mt-3">
        <CsrfField />
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#52d07b] text-white text-sm hover:opacity-90"
        >
          Get 50% off | {dollars(offer)} / mo
        </button>
      </form>
    </div>
  );
}
