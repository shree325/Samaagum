import { useState } from 'react';

export function useQuestionnaire({ draft, editEv }: any) {
  const [enableRegForm, setEnableRegForm] = useState(
    draft?.enableRegForm ?? editEv?.venue_raw?.meta?.enableRegForm ?? editEv?.venue?.meta?.enableRegForm ?? false
  );
  const [formFields, setFormFields] = useState(
    draft?.formFields ?? editEv?.venue_raw?.meta?.formFields ?? editEv?.venue?.meta?.formFields ?? [
      { id: 'f-1', type: 'text', question: 'What is your main area of interest?', required: true, responseType: 'short' },
      { id: 'f-2', type: 'social', question: 'LinkedIn Profile URL', required: true, platform: 'linkedin' },
    ]
  );
  const [questModalOpen, setQuestModalOpen] = useState(false);

  const moveField = (index: number, direction: number) => {
    const nextFields = [...formFields];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < nextFields.length) {
      const temp = nextFields[index];
      nextFields[index] = nextFields[targetIndex];
      nextFields[targetIndex] = temp;
      setFormFields(nextFields);
    }
  };

  return {
    enableRegForm,
    setEnableRegForm,
    formFields,
    setFormFields,
    questModalOpen,
    setQuestModalOpen,
    moveField,
  };
}
