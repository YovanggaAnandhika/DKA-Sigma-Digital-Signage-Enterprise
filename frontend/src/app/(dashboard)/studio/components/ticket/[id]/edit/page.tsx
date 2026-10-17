import { redirect } from 'next/navigation';

export default function QueueEditRootPage({ params }: { params: { id: string } }) {
  redirect(`/studio/components/ticket/${params.id}/edit/layout`);
}
