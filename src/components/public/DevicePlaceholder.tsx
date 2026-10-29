import { Navigation, Video, ShieldCheck, Cpu, Plane, Wrench } from "lucide-react";
import { ProductCategory } from "@/types/catalog";

interface DevicePlaceholderProps {
  category?: ProductCategory;
  title?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function DevicePlaceholder({
  category = "gps",
  title,
  className = "",
  size = "md",
}: DevicePlaceholderProps) {
  const sizeClasses = {
    sm: "h-28",
    md: "h-48",
    lg: "h-72",
  };

  const icons = {
    gps: Navigation,
    dashcam: Video,
    seguridad: ShieldCheck,
    accesorio: Cpu,
    dron: Plane,
    servicio: Wrench,
  };

  const IconComponent = icons[category] || Navigation;

  return (
    <div
      className={`relative w-full ${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-[#4A0C18] via-[#7A1428] to-[#1C1C1E] flex flex-col items-center justify-center p-4 text-center overflow-hidden border border-[#C9A15B]/20 shadow-inner group ${className}`}
    >
      {/* Texture decorativa de circuito */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#C9A15B_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Halo de luz de marca */}
      <div className="absolute w-24 h-24 rounded-full bg-[#C9A15B]/10 blur-xl pointer-events-none" />

      {/* Dispositivo icónico central */}
      <div className="relative z-10 w-12 h-12 rounded-xl bg-black/40 border border-[#C9A15B]/40 flex items-center justify-center text-[#C9A15B] shadow-md group-hover:scale-110 transition-transform">
        <IconComponent className="w-6 h-6" />
      </div>

      {title && (
        <span className="relative z-10 mt-2 text-[11px] font-bold text-gray-200 tracking-wide line-clamp-1 px-3">
          {title}
        </span>
      )}

      {/* Badge de autenticidad CoSoAVL */}
      <span className="relative z-10 text-[9px] uppercase tracking-wider text-[#C9A15B] font-semibold mt-0.5">
        CoSoAVL Hardware
      </span>
    </div>
  );
}

