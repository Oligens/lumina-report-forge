import emblem from "@/assets/scarwrite-emblem.png.asset.json";

interface Props {
  className?: string;
  /** Renders as a soft translucent watermark. */
  watermark?: boolean;
}

export function ScarWriteLogo({ className = "size-12", watermark = false }: Props) {
  return (
    <img
      src={emblem.url}
      alt="Emblème ScarWrite Rapport : plume dorée sur écusson bleu roi"
      className={`${className} object-contain ${
        watermark ? "opacity-[0.06] select-none" : "drop-shadow-[0_4px_14px_rgba(212,175,55,0.45)]"
      }`}
      draggable={false}
    />
  );
}
