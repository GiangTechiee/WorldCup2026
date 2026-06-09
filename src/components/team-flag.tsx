import * as FlagIcons from "country-flag-icons/react/3x2";

type FlagName = keyof typeof FlagIcons;

export function TeamFlag({
  countryCode,
  label,
  className = "",
}: {
  countryCode: string;
  label: string;
  className?: string;
}) {
  const Flag = FlagIcons[countryCode as FlagName];

  if (!Flag) {
    return (
      <span className={`flag-placeholder ${className}`} aria-label={`Chưa xác định cờ của ${label}`}>
        {label.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return <Flag className={`country-flag ${className}`} title={`Cờ ${label}`} />;
}
