interface AssuranceBadgeProps {
  level: string | null;
}

interface BadgeConfig {
  label: string;
  className: string;
}

function getBadgeConfig(level: string | null): BadgeConfig {
  if (level === 'mosip:idp:acr:biometrics' || level === 'high') {
    return {
      label: 'Biometric Verified',
      className: 'bg-green-100 text-green-800',
    };
  }

  if (level === 'mosip:idp:acr:generated-code' || level === 'substantial') {
    return {
      label: 'OTP Verified',
      className: 'bg-amber-100 text-amber-800',
    };
  }

  if (level === 'mosip:idp:acr:password' || level === 'low') {
    return {
      label: 'Password',
      className: 'bg-gray-100 text-gray-800',
    };
  }

  return {
    label: 'Unverified',
    className: 'bg-red-100 text-red-800',
  };
}

export function AssuranceBadge({ level }: AssuranceBadgeProps): React.ReactElement {
  const { label, className } = getBadgeConfig(level);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
