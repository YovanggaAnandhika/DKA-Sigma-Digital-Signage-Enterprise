'use client';

import React from 'react';
import { QueueManagementProvider } from './context/QueueManagementContext';

export default function TicketLayout({ children }: { children: React.ReactNode }) {
  return <QueueManagementProvider>{children}</QueueManagementProvider>;
}
