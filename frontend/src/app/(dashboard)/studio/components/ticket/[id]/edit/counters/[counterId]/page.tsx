import CounterFormPage from '../../../../components/counters/CounterFormPage';

export default async function Page({ params }: { params: Promise<{ counterId: string }> }) {
  const { counterId } = await params;
  return <CounterFormPage counterId={counterId} />;
}
