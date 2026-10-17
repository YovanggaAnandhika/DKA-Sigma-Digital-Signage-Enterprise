import CounterFormPage from '../../../components/counters/CounterFormPage';

export default function Page({ params }: { params: { counterId: string } }) {
  return <CounterFormPage counterId={params.counterId} />;
}
