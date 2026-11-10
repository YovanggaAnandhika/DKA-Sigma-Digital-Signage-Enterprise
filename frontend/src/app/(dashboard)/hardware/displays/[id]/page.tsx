import { redirect } from 'next/navigation';

export default function DisplayDetailPage({ params }: { params: { id: string } }) {
  redirect(`/hardware/displays/${params.id}/overview`);
}
