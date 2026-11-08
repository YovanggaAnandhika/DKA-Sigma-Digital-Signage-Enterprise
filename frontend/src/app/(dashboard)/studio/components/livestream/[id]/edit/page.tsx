'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import LiveStreamEditorForm from '../../LiveStreamEditorForm';

export default function EditLiveStreamPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  return <LiveStreamEditorForm streamId={id} />;
}

