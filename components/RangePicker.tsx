'use client';

const OPTIONS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'ytd', label: 'YTD' },
  { key: 'yearly', label: 'Yearly' },
];

export default function RangePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full border bg-white p-1 shadow-sm">
      {OPTIONS.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-3 py-1 text-sm rounded-full transition
            ${value === o.key ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
