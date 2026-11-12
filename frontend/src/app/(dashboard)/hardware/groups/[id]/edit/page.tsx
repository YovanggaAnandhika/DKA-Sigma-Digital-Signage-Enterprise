import { redirect } from 'next/navigation';

export default async function GroupsEditRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/hardware/displays/groups/${id}/edit`);
}
