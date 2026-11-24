interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'symbol';
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

  if (variant === 'symbol') {
    const imgSize = { sm: 'h-6', md: 'h-8', lg: 'h-10' }[size];
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img
          src="/uploads/20261123-213903-image-9ydr.png"
          alt="ARTHEUS 심볼"
          className={`${imgSize} w-auto`}
          draggable={false}
        />
        <span className="text-[#F3F0EA] font-black tracking-[0.08em] text-sm">
          artheus
        </span>
      </div>
    );
  }

  return (
    <div className={`font-black tracking-tight ${sizeClasses[size]} ${className}`}>
      <div className="text-[#F3F0EA] tracking-[0.1em]">artheus</div>
    </div>
  );
}
