type BadgeCountProps = {
  count: number;
  /** max angka sebelum tampil "X+" */
  max?: number;
  className?: string;
};

export function BadgeCount({ count, max = 99, className }: BadgeCountProps) {
  if (count <= 0) return null;

  const label = count > max ? `${max}+` : String(count);

  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black leading-none text-white ${className ?? ""}`}
    >
      {label}
    </span>
  );
}