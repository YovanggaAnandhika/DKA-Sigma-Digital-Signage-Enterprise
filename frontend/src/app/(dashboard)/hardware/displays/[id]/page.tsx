import { redirect } from 'next/navigation';

export default async function DisplayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/hardware/displays/${id}/overview`);
}
