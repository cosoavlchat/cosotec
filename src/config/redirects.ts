export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

/**
 * Redirecciones permanentes 301 para preservar el SEO histórico de cosoavl.com.
 */
export async function redirects(): Promise<RedirectRule[]> {
  return [
    { source: "/index.html", destination: "/", permanent: true },
    {
      source: "/soluciones_localizacion_automatica_gps_basico.html",
      destination: "/plataforma",
      permanent: true,
    },
    {
      source: "/soluciones_localizacion_automatica_gps_premium.html",
      destination: "/plataforma",
      permanent: true,
    },
    {
      source: "/soluciones_localizacion_automatica_gps_next.html",
      destination: "/plataforma",
      permanent: true,
    },
    {
      source: "/app_gratuita_localizacion_automatica_gps.html",
      destination: "/plataforma",
      permanent: true,
    },
    {
      source: "/rastreo_satelital_via_internet_gps.html",
      destination: "/plataforma/gps",
      permanent: true,
    },
    { source: "/reporte_gps_avl.html", destination: "/plataforma/gps", permanent: true },
    { source: "/central_monitoreo_gps.html", destination: "/nosotros", permanent: true },
    { source: "/servicios_de_postventa_coso_avl.html", destination: "/nosotros", permanent: true },
    {
      source: "/beneficios_localizacion_automatica_gps.html",
      destination: "/nosotros",
      permanent: true,
    },
    {
      source: "/quienes_localizacion_automatica_gps.html",
      destination: "/nosotros",
      permanent: true,
    },
    {
      source: "/productos_cosoavl_localizacion_automatica_gps.html",
      destination: "/tienda",
      permanent: true,
    },
    { source: "/promociones_cosoavl.html", destination: "/tienda", permanent: true },
    {
      source: "/productos_gtx7_:slug(.*)",
      destination: "/soluciones/auto-camioneta",
      permanent: true,
    },
    {
      source: "/productos_gtx7plus_:slug(.*)",
      destination: "/soluciones/auto-camioneta",
      permanent: true,
    },
    {
      source: "/productos_gtx9_:slug(.*)",
      destination: "/soluciones/tractocamion",
      permanent: true,
    },
    {
      source: "/productos_gtx10_:slug(.*)",
      destination: "/soluciones/tractocamion",
      permanent: true,
    },
    {
      source: "/productos_gtx8rf_:slug(.*)",
      destination: "/soluciones/caja-refrigerada",
      permanent: true,
    },
    {
      source: "/productos_trailer_track_:slug(.*)",
      destination: "/soluciones/caja-refrigerada",
      permanent: true,
    },
    {
      source: "/productos_magnet_track_:slug(.*)",
      destination: "/soluciones/caja-refrigerada",
      permanent: true,
    },
    {
      source: "/productos_equipo_pesado_:slug(.*)",
      destination: "/soluciones/maquinaria",
      permanent: true,
    },
    {
      source: "/productos_m_track_:slug(.*)",
      destination: "/soluciones/motos",
      permanent: true,
    },
    {
      source: "/productos_gt_peersonal_localizacion_automatica_gps.html",
      destination: "/tienda/gps",
      permanent: true,
    },
    {
      source: "/contacto_localizacion_automatica_gps.html",
      destination: "/contacto",
      permanent: true,
    },
    { source: "/politica_privacidad_cosoavl.html", destination: "/privacidad", permanent: true },
    { source: "/equipo_cosoavl.html", destination: "/contacto", permanent: true },
  ];
}

