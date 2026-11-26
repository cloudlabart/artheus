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
    const imgSize = { sm: 'h-6', md: 'h-9', lg: 'h-11' }[size];
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src="/uploads/20261124-093657-image-baen.png"
          alt="ARTHEUS 심볼"
          className={`${imgSize} w-auto`}
          draggable={false}
        />
        <span className="text-[#F3F0EA] font-black tracking-[0.1em] text-base">
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
