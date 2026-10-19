export const QUEUE_STORAGE_KEY = 'dka_signage_queue_displays';
export const QUEUE_HISTORY_STORAGE_KEY = 'dka_signage_queue_call_history';

export function injectQueueVariables(
  template: string,
  data: {
    queueNumber?: string;
    queueCounter?: string;
    queuePrefix?: string;
    queueName?: string;
    operatorName?: string;
    waitingCount?: number;
    counterLabel?: string;
  }
): string {
  if (!template) return '';
  const label = (data.counterLabel || 'Loket').trim();

  // Ekstrak nomor atau identitas pos tanpa awalan label lama (misal: "LOKET 01" -> "1", "POLI 02" -> "2", "1" -> "1")
  const rawCounter = (data.queueCounter || '1').trim();
  const labelRegex = new RegExp(`^(?:${label}|loket|poli|teller|kasir|meja|counter|pickup point)\\s*`, 'i');
  let cleanCounterNumber = rawCounter.replace(labelRegex, '').trim();
  if (/^0+\d+$/.test(cleanCounterNumber)) {
    cleanCounterNumber = cleanCounterNumber.replace(/^0+/, '');
  }
  if (!cleanCounterNumber) {
    cleanCounterNumber = rawCounter.replace(/[^0-9]/g, '') || '1';
  }

  // Tampilkan label dinamis sesuai jenis/sektor: "POLI 1", "PICKUP POINT 1", "TELLER 1", "KASIR 1", "LOKET 1"
  const formattedCounter = `${label.toUpperCase()} ${cleanCounterNumber}`;

  return template
    .replaceAll('$queue_number$', data.queueNumber || 'A-001')
    .replaceAll('$queue_counter$', formattedCounter)
    .replaceAll('$queue_prefix$', data.queuePrefix || 'A')
    .replaceAll('$queue_name$', data.queueName || 'Layar Antrian')
    .replaceAll('$operator_name$', data.operatorName || 'Petugas')
    .replaceAll('$waiting_count$', String(data.waitingCount ?? 0));
}
