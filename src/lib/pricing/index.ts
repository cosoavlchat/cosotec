/**
 * CosoTec - Motor de Precios y Manejo de Moneda
 * REGLA 1: Todos los montos se almacenan y calculan en CENTAVOS enteros (ej. $100.00 MXN = 10000 centavos).
 * REGLA 2: En base de datos sólo se guarda el precio sin IVA.
 */

export const DEFAULT_IVA_PERCENT = 16;
export const DEFAULT_VOLUMEN_UMBRAL = 5;
export const DEFAULT_VOLUMEN_PORCENTAJE = 10;

/**
 * Calcula el IVA en centavos redondeado a entero.
 */
export function calcularIvaCentavos(
  precioSinIvaCentavos: number,
  ivaPercent: number = DEFAULT_IVA_PERCENT
): number {
  if (!Number.isInteger(precioSinIvaCentavos)) {
    throw new TypeError(
      `precioSinIvaCentavos debe ser un entero en centavos. Recibido: ${precioSinIvaCentavos}`
    );
  }
  return Math.round(precioSinIvaCentavos * (ivaPercent / 100));
}

/**
 * Retorna el precio total con IVA en centavos.
 * Garantiza: totalCentavos === precioSinIvaCentavos + ivaCentavos.
 */
export function precioConIva(
  precioSinIvaCentavos: number,
  ivaPercent: number = DEFAULT_IVA_PERCENT
): number {
  const iva = calcularIvaCentavos(precioSinIvaCentavos, ivaPercent);
  return precioSinIvaCentavos + iva;
}

/**
 * Retorna el desglose exacto (subtotal, IVA y total con IVA) en centavos.
 */
export function desglosePrecio(
  precioSinIvaCentavos: number,
  ivaPercent: number = DEFAULT_IVA_PERCENT
): {
  precioSinIvaCentavos: number;
  ivaCentavos: number;
  totalConIvaCentavos: number;
} {
  const ivaCentavos = calcularIvaCentavos(precioSinIvaCentavos, ivaPercent);
  return {
    precioSinIvaCentavos,
    ivaCentavos,
    totalConIvaCentavos: precioSinIvaCentavos + ivaCentavos,
  };
}

export interface ItemCotizacion {
  cantidad: number;
  esEquipoPrincipal: boolean;
  precioSinIvaCentavos: number;
}

/**
 * REGLA 6: Descuento por volumen.
 * 5 unidades = sin descuento (0%)
 * 6 o más unidades = 10% de descuento sobre el subtotal
 * IMPORTANTE: Solo cuentan los equipos principales (esEquipoPrincipal === true),
 * los accesorios NO suman para alcanzar el umbral.
 */
export function calcularDescuentoVolumen(
  items: ItemCotizacion[],
  umbralUnidades: number = DEFAULT_VOLUMEN_UMBRAL,
  porcentajeDescuento: number = DEFAULT_VOLUMEN_PORCENTAJE
): {
  unidadesPrincipales: number;
  aplicaDescuento: boolean;
  porcentajeAplicado: number;
  subtotalSinIvaCentavos: number;
  descuentoCentavos: number;
  subtotalConDescuentoCentavos: number;
} {
  let unidadesPrincipales = 0;
  let subtotalSinIvaCentavos = 0;

  for (const item of items) {
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      throw new TypeError(`Cantidad inválida: ${item.cantidad}`);
    }
    if (!Number.isInteger(item.precioSinIvaCentavos) || item.precioSinIvaCentavos < 0) {
      throw new TypeError(`Precio inválido en centavos: ${item.precioSinIvaCentavos}`);
    }

    if (item.esEquipoPrincipal) {
      unidadesPrincipales += item.cantidad;
    }
    subtotalSinIvaCentavos += item.precioSinIvaCentavos * item.cantidad;
  }

  // Al comprar MÁS de 5 unidades (umbral)
  const aplicaDescuento = unidadesPrincipales > umbralUnidades;
  const porcentajeAplicado = aplicaDescuento ? porcentajeDescuento : 0;
  const descuentoCentavos = aplicaDescuento
    ? Math.round(subtotalSinIvaCentavos * (porcentajeDescuento / 100))
    : 0;

  return {
    unidadesPrincipales,
    aplicaDescuento,
    porcentajeAplicado,
    subtotalSinIvaCentavos,
    descuentoCentavos,
    subtotalConDescuentoCentavos: subtotalSinIvaCentavos - descuentoCentavos,
  };
}

/**
 * Formatea un entero en centavos al estándar de moneda mexicana:
 * Ej: 550000 -> "$5,500.00"
 */
export function formatMxn(centavos: number, incluirSimbolo: boolean = true): string {
  if (!Number.isFinite(centavos)) return "$0.00";
  const esNegativo = centavos < 0;
  const absCentavos = Math.abs(Math.round(centavos));
  const pesos = Math.floor(absCentavos / 100);
  const residuoCentavos = absCentavos % 100;

  const pesosStr = pesos.toLocaleString("es-MX");
  const centavosStr = residuoCentavos.toString().padStart(2, "0");

  const formateado = `${pesosStr}.${centavosStr}`;
  if (esNegativo) {
    return incluirSimbolo ? `-$${formateado}` : `-${formateado}`;
  }
  return incluirSimbolo ? `$${formateado}` : formateado;
}

/**
 * Convierte un número o string con formato (ej. "5,500.50" o 5500.5) a centavos enteros.
 */
export function parseToCentavos(valor: string | number): number {
  if (typeof valor === "number") {
    return Math.round(valor * 100);
  }
  const limpio = valor.replace(/[^0-9.-]/g, "");
  const num = parseFloat(limpio);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Genera la lista oficial de viñetas para "¿Qué incluye?" considerando
 * dinámicamente las casillas incluyeInstalacion e incluyePlanPrimerAnio.
 */
export function getQueIncluyeComputed(item: {
  queIncluye?: string[];
  incluyeInstalacion?: boolean;
  incluyePlanPrimerAnio?: boolean;
}): string[] {
  const result: string[] = [];

  if (item.incluyeInstalacion) {
    result.push("Instalación profesional");
  }
  if (item.incluyePlanPrimerAnio) {
    result.push("Primer año de plataforma y datos");
  }

  if (item.queIncluye && item.queIncluye.length > 0) {
    for (const q of item.queIncluye) {
      const lower = q.toLowerCase();
      // Evitar redundancias con las dos viñetas estandarizadas
      if (
        (item.incluyeInstalacion &&
          (lower.includes("instalación estándar") ||
            lower.includes("instalacion estandar") ||
            lower.includes("instalación profesional") ||
            lower.includes("instalacion profesional") ||
            lower.includes("instalación oculta") ||
            lower.includes("instalacion oculta"))) ||
        (item.incluyePlanPrimerAnio &&
          (lower.includes("primer año") || lower.includes("licencia anual") || lower.includes("1 año")))
      ) {
        continue;
      }
      result.push(q);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// MOTOR UNIFICADO DE COTIZACIÓN (SERVIDOR)
// ---------------------------------------------------------------------------

export interface CostoRecurrenteItem {
  concepto: string;
  montoCentavos: number;
  periodo: "mensual" | "anual";
}

export interface CotizacionItemInput {
  id?: string;
  nombre?: string;
  precioSinIvaCentavos: number;
  cantidad: number;
  esEquipoPrincipal: boolean;
  categoria?: string;
  activo?: boolean;
  revisarPrecio?: boolean;
  incluyeInstalacion?: boolean; // false si requiere agregar instalación por separado
  incluyePlanPrimerAnio?: boolean; // true si incluye plataforma y SIM por 12 meses
  servicioInstalacionId?: string;
  servicioInstalacionNombre?: string;
  servicioInstalacionPrecioSinIvaCentavos?: number; // default 95000 ($950.00 sin IVA)
  recurrentes?: CostoRecurrenteItem[];
}

export interface LineaCalculada {
  id?: string;
  nombre: string;
  cantidad: number;
  precioSinIvaCentavos: number;
  totalSinIvaCentavos: number;
  esEquipoPrincipal: boolean;
  esInstalacionAgregada?: boolean;
}

export interface ViaticosInput {
  estadoId?: string;
  estadoNombre?: string;
  sinCosto?: boolean;
  montoPorVisitaCentavos?: number;
  montoPorUnidadCentavos?: number;
}

export interface OpcionesCotizacion {
  ivaPorcentaje?: number;
  descuentoVolumen?: {
    umbralUnidades?: number; // default 5 (aplica a > 5, es decir >= 6)
    porcentaje?: number; // default 10
  };
  descuentoVendedorPorcentaje?: number;
  topeDescuentoVendedor?: number; // default 5
  planesConfig?: {
    crediContadoPorcentajeCompra?: number; // default 55
    enganchePorcentaje?: number; // default 55
    engancheMensualidadesCount?: number; // default 2
    msiPlazos?: number[]; // default [] (vacío por defecto)
  };
}

export interface PagoDetalle {
  numero: number;
  concepto: string;
  montoCentavos: number;
  momento: "inmediato" | "al_instalar" | "mensualidad";
  montoFormateado: string;
  fechaEstimada?: string; // REGLA: Fecha o plazo estimado en esquemas diferidos
}

export interface PlanPagoDetalle {
  tipo: "contado" | "credi_contado" | "enganche_mensualidades" | "msi";
  nombre: string;
  descripcion: string;
  montoPrimerPagoCentavos: number;
  saldoRestanteCentavos: number;
  totalCentavos: number;
  pagos: PagoDetalle[];
}

export interface CostoRecurrenteDetalle {
  concepto: string;
  montoCentavos: number;
  periodo: "mensual" | "anual";
  montoFormateado: string;
}

export interface CotizacionResultado {
  totalUnidades: number;
  unidadesPrincipales: number;
  subtotalBrutoCentavos: number;
  aplicaDescuentoVolumen: boolean;
  porcentajeDescuentoVolumen: number;
  descuentoVolumenCentavos: number;
  descuentoVendedorPorcentaje: number;
  descuentoVendedorCentavos: number;
  subtotalConDescuentoCentavos: number;
  costosRecurrentes: CostoRecurrenteDetalle[];
  lineasCalculadas: LineaCalculada[];
  instalacionesAgregadasCount: number;
  viaticosCentavos: number;
  viaticosPorConfirmar: boolean;
  viaticosDescripcion: string;
  baseGravableCentavos: number;
  ivaPorcentaje: number;
  ivaCentavos: number;
  totalCentavos: number;
  planesPago: Record<string, PlanPagoDetalle>;
  formato: {
    subtotalBruto: string;
    descuento: string;
    descuentoVolumen: string;
    descuentoVendedor: string;
    subtotalConDescuento: string;
    viaticos: string;
    iva: string;
    total: string;
  };
}

/**
 * Función canónica del servidor para calcular cotizaciones, carritos y pedidos.
 * Procesa todos los cálculos estrictamente en centavos enteros con ajuste exacto en la última cuota.
 */
export function calcularCotizacion(
  items: CotizacionItemInput[],
  viaticos?: ViaticosInput,
  opciones?: OpcionesCotizacion
): CotizacionResultado {
  let unidadesPrincipales = 0;
  let totalUnidades = 0;
  let subtotalBrutoCentavos = 0;
  const costosRecurrentes: CostoRecurrenteDetalle[] = [];
  const lineasCalculadas: LineaCalculada[] = [];
  let instalacionesAgregadasCount = 0;

  for (const item of items) {
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      throw new TypeError(`Cantidad inválida: ${item.cantidad}. Debe ser un número entero mayor a 0.`);
    }
    if (!Number.isInteger(item.precioSinIvaCentavos) || item.precioSinIvaCentavos < 0) {
      throw new TypeError(`Precio inválido en centavos: ${item.precioSinIvaCentavos}`);
    }
    if (item.activo === false) {
      throw new Error(
        `El producto "${item.nombre || item.id || "desconocido"}" no está activo y no se puede cotizar.`
      );
    }
    if (item.revisarPrecio === true) {
      throw new Error(
        `El producto "${item.nombre || item.id || "desconocido"}" tiene precio en revisión y no se puede cotizar para pago en línea.`
      );
    }

    totalUnidades += item.cantidad;
    if (item.esEquipoPrincipal) {
      unidadesPrincipales += item.cantidad;
    }
    const totalRenglon = item.precioSinIvaCentavos * item.cantidad;
    subtotalBrutoCentavos += totalRenglon;

    lineasCalculadas.push({
      id: item.id,
      nombre: item.nombre || "Producto",
      cantidad: item.cantidad,
      precioSinIvaCentavos: item.precioSinIvaCentavos,
      totalSinIvaCentavos: totalRenglon,
      esEquipoPrincipal: item.esEquipoPrincipal,
    });

    // REGLA FASE 3: Si incluyeInstalacion es false, se agrega automáticamente
    // la instalación técnica por unidad como línea separada y visible.
    if (item.incluyeInstalacion === false) {
      const precioInstalacion = item.servicioInstalacionPrecioSinIvaCentavos ?? 95000; // $950.00
      const totalInstalacion = precioInstalacion * item.cantidad;
      subtotalBrutoCentavos += totalInstalacion;
      instalacionesAgregadasCount += item.cantidad;

      lineasCalculadas.push({
        id: "instalacion-suelta",
        nombre: item.servicioInstalacionNombre || `Instalación suelta / Mano de obra (${item.nombre || "GPS"})`,
        cantidad: item.cantidad,
        precioSinIvaCentavos: precioInstalacion,
        totalSinIvaCentavos: totalInstalacion,
        esEquipoPrincipal: false, // Las instalaciones no cuentan como equipo principal
        esInstalacionAgregada: true,
      });
    }

    if (item.recurrentes && item.recurrentes.length > 0) {
      for (const rec of item.recurrentes) {
        const montoTotalRecurrente = rec.montoCentavos * item.cantidad;
        const conceptoModificado =
          item.incluyePlanPrimerAnio && rec.periodo === "anual" && !rec.concepto.includes("a partir del segundo año")
            ? `${rec.concepto} (a partir del segundo año)`
            : rec.concepto;

        costosRecurrentes.push({
          concepto: conceptoModificado,
          montoCentavos: montoTotalRecurrente,
          periodo: rec.periodo,
          montoFormateado: formatMxn(montoTotalRecurrente),
        });
      }
    } else if (item.incluyePlanPrimerAnio && item.esEquipoPrincipal) {
      // REGLA: Si incluye el primer año, la renovación anual aparece como costo recurrente a partir del segundo año
      const montoRenovacion = 258375 * item.cantidad; // $2,583.75 sin IVA ($2,997.15 con IVA)
      costosRecurrentes.push({
        concepto: `Renovación anual plataforma y datos (${item.nombre || "Equipo"}) (a partir del segundo año)`,
        montoCentavos: montoRenovacion,
        periodo: "anual",
        montoFormateado: formatMxn(montoRenovacion),
      });
    }
  }

  // 1. Descuento por volumen (> 5 unidades principales)
  const umbral = opciones?.descuentoVolumen?.umbralUnidades ?? DEFAULT_VOLUMEN_UMBRAL;
  const pctDescuento = opciones?.descuentoVolumen?.porcentaje ?? DEFAULT_VOLUMEN_PORCENTAJE;
  const aplicaDescuentoVolumen = unidadesPrincipales > umbral;
  const porcentajeDescuentoVolumen = aplicaDescuentoVolumen ? pctDescuento : 0;
  const descuentoVolumenCentavos = aplicaDescuentoVolumen
    ? Math.round(subtotalBrutoCentavos * (pctDescuento / 100))
    : 0;

  // 2. Descuento de vendedor (opcional, sujeto a tope configurado)
  const topeVendedor = opciones?.topeDescuentoVendedor ?? 5;
  const pctVendedor = opciones?.descuentoVendedorPorcentaje ?? 0;
  if (pctVendedor < 0) {
    throw new Error(`El descuento de vendedor no puede ser negativo: ${pctVendedor}%`);
  }
  if (pctVendedor > topeVendedor) {
    throw new Error(
      `El descuento de vendedor solicitado (${pctVendedor}%) supera el tope máximo autorizado (${topeVendedor}%).`
    );
  }
  const baseParaVendedor = subtotalBrutoCentavos - descuentoVolumenCentavos;
  const descuentoVendedorCentavos = Math.round(baseParaVendedor * (pctVendedor / 100));
  const subtotalConDescuentoCentavos = baseParaVendedor - descuentoVendedorCentavos;

  // 3. Viáticos por estado
  let viaticosCentavos = 0;
  let viaticosPorConfirmar = false;
  let viaticosDescripcion = "Sin viáticos especificados";

  if (viaticos) {
    if (viaticos.sinCosto) {
      viaticosCentavos = 0;
      viaticosPorConfirmar = false;
      viaticosDescripcion = "Sin costo de viáticos";
    } else {
      const montoVisita = viaticos.montoPorVisitaCentavos ?? 0;
      const montoUnidad = viaticos.montoPorUnidadCentavos ?? 0;

      if (montoVisita === 0 && montoUnidad === 0) {
        // Estado sin monto definido -> "Se cotiza"
        viaticosCentavos = 0;
        viaticosPorConfirmar = true;
        viaticosDescripcion = "Se cotiza (viáticos por confirmar)";
      } else {
        viaticosCentavos = montoVisita + (montoUnidad * totalUnidades);
        viaticosPorConfirmar = false;
        viaticosDescripcion = formatMxn(viaticosCentavos);
      }
    }
  }

  // 4. Base Gravable e IVA (16%)
  // NOTA: Los costos recurrentes NO se suman a la base gravable de compra inicial
  const baseGravableCentavos = subtotalConDescuentoCentavos + viaticosCentavos;
  const ivaPorcentaje = opciones?.ivaPorcentaje ?? DEFAULT_IVA_PERCENT;
  const ivaCentavos = Math.round(baseGravableCentavos * (ivaPorcentaje / 100));
  const totalCentavos = baseGravableCentavos + ivaCentavos;

  // 5. Planes de Pago con Ajuste Exacto de Centavos
  const planesPago: Record<string, PlanPagoDetalle> = {};

  // Plan A: Contado 100%
  planesPago["contado"] = {
    tipo: "contado",
    nombre: "Pago de Contado (100%)",
    descripcion: "Liquida el total en una sola exhibición mediante tarjeta o transferencia SPEI.",
    montoPrimerPagoCentavos: totalCentavos,
    saldoRestanteCentavos: 0,
    totalCentavos,
    pagos: [
      {
        numero: 1,
        concepto: "Pago único de contado",
        montoCentavos: totalCentavos,
        momento: "inmediato",
        montoFormateado: formatMxn(totalCentavos),
        fechaEstimada: "Inmediato (hoy)",
      },
    ],
  };

  // Plan B: Credi-Contado (55% al comprar, 45% al instalar)
  const ccCompraPct = opciones?.planesConfig?.crediContadoPorcentajeCompra ?? 55;
  const ccPago1 = Math.round(totalCentavos * (ccCompraPct / 100));
  const ccPago2 = totalCentavos - ccPago1; // Ajuste exacto de centavos
  planesPago["credi_contado"] = {
    tipo: "credi_contado",
    nombre: `Credi-Contado (${ccCompraPct}% / ${100 - ccCompraPct}%)`,
    descripcion: `${ccCompraPct}% al confirmar tu pedido y ${100 - ccCompraPct}% al concluir la instalación técnica.`,
    montoPrimerPagoCentavos: ccPago1,
    saldoRestanteCentavos: ccPago2,
    totalCentavos,
    pagos: [
      {
        numero: 1,
        concepto: `Anticipo de compra (${ccCompraPct}%)`,
        montoCentavos: ccPago1,
        momento: "inmediato",
        montoFormateado: formatMxn(ccPago1),
        fechaEstimada: "Inmediato (hoy al confirmar)",
      },
      {
        numero: 2,
        concepto: `Finiquito contra instalación (${100 - ccCompraPct}%)`,
        montoCentavos: ccPago2,
        momento: "al_instalar",
        montoFormateado: formatMxn(ccPago2),
        fechaEstimada: "Al concluir instalación técnica",
      },
    ],
  };

  // Plan C: Enganche 55% + 2 mensualidades iguales
  const engPct = opciones?.planesConfig?.enganchePorcentaje ?? 55;
  const mensualidadesCount = opciones?.planesConfig?.engancheMensualidadesCount ?? 2;
  const engMonto = Math.round(totalCentavos * (engPct / 100));
  const engRestante = totalCentavos - engMonto;
  const cuotaBase = Math.floor(engRestante / mensualidadesCount);

  const pagosEnganche: PagoDetalle[] = [
    {
      numero: 1,
      concepto: `Enganche inicial (${engPct}%)`,
      montoCentavos: engMonto,
      momento: "inmediato",
      montoFormateado: formatMxn(engMonto),
      fechaEstimada: "Inmediato (hoy al confirmar)",
    },
  ];

  let sumaCuotas = 0;
  for (let i = 1; i <= mensualidadesCount; i++) {
    const esUltima = i === mensualidadesCount;
    const montoCuota = esUltima ? engRestante - sumaCuotas : cuotaBase;
    sumaCuotas += montoCuota;
    const diasEstimados = i * 30;
    pagosEnganche.push({
      numero: i + 1,
      concepto: `Mensualidad ${i} de ${mensualidadesCount}`,
      montoCentavos: montoCuota,
      momento: "mensualidad",
      montoFormateado: formatMxn(montoCuota),
      fechaEstimada: `+${diasEstimados} días después de la instalación`,
    });
  }

  planesPago["enganche_mensualidades"] = {
    tipo: "enganche_mensualidades",
    nombre: `Enganche ${engPct}% + ${mensualidadesCount} Pagos`,
    descripcion: `Anticipo del ${engPct}% y el resto dividido en ${mensualidadesCount} exhibiciones mensuales.`,
    montoPrimerPagoCentavos: engMonto,
    saldoRestanteCentavos: engRestante,
    totalCentavos,
    pagos: pagosEnganche,
  };

  // Plan D: MSI (Solo si está configurado en settings con plazos > 0)
  const msiPlazos = opciones?.planesConfig?.msiPlazos ?? [];
  if (msiPlazos.length > 0) {
    for (const plazo of msiPlazos) {
      if (plazo > 0) {
        const cuotaMsiBase = Math.floor(totalCentavos / plazo);
        const pagosMsi: PagoDetalle[] = [];
        let sumaMsi = 0;
        for (let j = 1; j <= plazo; j++) {
          const esUltima = j === plazo;
          const montoMsi = esUltima ? totalCentavos - sumaMsi : cuotaMsiBase;
          sumaMsi += montoMsi;
          pagosMsi.push({
            numero: j,
            concepto: `Mensualidad ${j} de ${plazo} MSI`,
            montoCentavos: montoMsi,
            momento: j === 1 ? "inmediato" : "mensualidad",
            montoFormateado: formatMxn(montoMsi),
          });
        }
        planesPago[`msi_${plazo}`] = {
          tipo: "msi",
          nombre: `${plazo} Meses Sin Intereses`,
          descripcion: `Paga en ${plazo} cuotas de ${formatMxn(cuotaMsiBase)}/mes con tarjetas de crédito participantes.`,
          montoPrimerPagoCentavos: totalCentavos,
          saldoRestanteCentavos: 0,
          totalCentavos,
          pagos: pagosMsi,
        };
      }
    }
  }

  const totalDescuentoCentavos = descuentoVolumenCentavos + descuentoVendedorCentavos;

  return {
    totalUnidades,
    unidadesPrincipales,
    subtotalBrutoCentavos,
    aplicaDescuentoVolumen,
    porcentajeDescuentoVolumen,
    descuentoVolumenCentavos,
    descuentoVendedorPorcentaje: pctVendedor,
    descuentoVendedorCentavos,
    subtotalConDescuentoCentavos,
    costosRecurrentes,
    lineasCalculadas,
    instalacionesAgregadasCount,
    viaticosCentavos,
    viaticosPorConfirmar,
    viaticosDescripcion,
    baseGravableCentavos,
    ivaPorcentaje,
    ivaCentavos,
    totalCentavos,
    planesPago,
    formato: {
      subtotalBruto: formatMxn(subtotalBrutoCentavos),
      descuento: formatMxn(totalDescuentoCentavos),
      descuentoVolumen: formatMxn(descuentoVolumenCentavos),
      descuentoVendedor: formatMxn(descuentoVendedorCentavos),
      subtotalConDescuento: formatMxn(subtotalConDescuentoCentavos),
      viaticos: formatMxn(viaticosCentavos),
      iva: formatMxn(ivaCentavos),
      total: formatMxn(totalCentavos),
    },
  };
}
