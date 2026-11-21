interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', variant = 'full', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xs leading-tight',
    md: 'text-sm leading-tight',
    lg: 'text-base leading-tight',
  };

  if (variant === 'icon') {
    return (
      <img
        src="/favicon.png"
        alt="ARTHEUS Icon"
        className="h-8 w-auto"
      />
    );
  }

  return (
    <div className={`font-black tracking-tight ${sizeClasses[size]} ${className}`}>
      <div className="text-[#132B3F] tracking-[0.1em]">artheus</div>
    </div>
  );
}
