import { redirect } from 'next/navigation';

export default function IotRootPage() {
  redirect('/hardware/iot/devices');
}
