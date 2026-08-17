import { useState } from "react";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
};

export function ProductImage({
  src,
  alt,
  className = "w-full h-full object-cover",
  fallbackClassName = "w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-stone-100 text-sm text-slate-500",
}: ProductImageProps) {
  const [hasError, setHasError] = useState(!src);

  if (!src || hasError) {
    return (
      <div className={fallbackClassName} role="img" aria-label={`${alt} — imagem indisponível`}>
        <span>Imagem indisponível</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}
