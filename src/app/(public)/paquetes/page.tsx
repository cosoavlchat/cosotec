import { getPackages } from "@/lib/services/catalog-service";
import { PackageCard } from "@/components/public/PackageCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paquetes Comerciales Listos | CosoTec by CoSoAVL",
  description:
    "Kits listos de rastreo GPS, DashCams industriales y seguridad anti-jammer con instalación profesional incluida.",
};

export default async function PaquetesPage() {
  const packages = await getPackages(false);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-semibold">
          <span>Soluciones Integrales</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Paquetes Comerciales Listos para Instalar
        </h1>
        <p className="text-xs text-gray-500 max-w-2xl">
          Paquetes completos llave en mano con equipo, instalación profesional oculta, SIM de datos y licencia anual con app móvil.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <PackageCard key={pkg.slug} pkg={pkg} />
        ))}
      </div>
    </div>
  );
}

