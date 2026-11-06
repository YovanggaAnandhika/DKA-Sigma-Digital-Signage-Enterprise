import { redirect } from 'next/navigation';

export default function GroupsEditRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/hardware/displays/groups/${params.id}/edit`);
}
