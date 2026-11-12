import { redirect } from 'next/navigation';

export default async function QueueEditRootPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/studio/components/ticket/${id}/edit/controll`);
}
