// lib/sii-giros.ts — Giros / actividades del SII más comunes para B2B industrial.
// Basado en los códigos CIIU.CL más usados por empresas industriales chilenas.

export const GIROS_SII: { categoria: string; items: string[] }[] = [
  {
    categoria: 'Comercio al por mayor',
    items: [
      'Venta al por mayor de materiales de construcción, artículos de ferretería',
      'Venta al por mayor de productos químicos industriales',
      'Venta al por mayor de maquinaria, equipos y materiales conexos',
      'Venta al por mayor de equipos eléctricos, electrónicos y de iluminación',
      'Venta al por mayor de productos de hidráulica y neumática',
      'Venta al por mayor de equipos de seguridad industrial y EPP',
      'Venta al por mayor de lubricantes, aceites y grasas industriales',
      'Venta al por mayor de productos alimenticios para industria y food service',
      'Venta al por mayor de envases, embalajes y materiales de packaging',
      'Venta al por mayor de plásticos, resinas y polímeros',
      'Venta al por mayor de productos para minería y metalurgia',
      'Venta al por mayor de equipos HVAC, refrigeración y climatización',
      'Venta al por mayor de equipos para tratamiento de aguas',
      'Venta al por mayor de productos farmacéuticos y suplementos',
      'Venta al por mayor de productos cosméticos y cuidado personal',
      'Venta al por mayor de productos de limpieza industrial',
      'Venta al por mayor de productos para agricultura y agroindustria',
      'Venta al por mayor de equipos solares y de eficiencia energética',
      'Venta al por mayor de productos forestales, maderas y tableros',
      'Venta al por mayor de repuestos y accesorios automotrices',
      'Venta al por mayor de equipos de logística y bodegaje',
      'Venta al por mayor de mobiliario industrial y corporativo',
    ],
  },
  {
    categoria: 'Fabricación',
    items: [
      'Fabricación de sustancias químicas básicas',
      'Fabricación de productos químicos',
      'Fabricación de productos plásticos',
      'Fabricación de productos de caucho',
      'Fabricación de productos farmacéuticos',
      'Fabricación de cosméticos y productos de cuidado personal',
      'Fabricación de jabones, detergentes y productos de limpieza',
      'Fabricación de productos alimenticios',
      'Fabricación de bebidas',
      'Fabricación de envases de plástico, vidrio o metal',
      'Fabricación de maquinaria y equipos industriales',
      'Fabricación de productos eléctricos y electrónicos',
      'Fabricación de productos metálicos para uso estructural',
      'Fabricación de productos textiles industriales',
      'Fabricación de muebles industriales y corporativos',
    ],
  },
  {
    categoria: 'Importación / Distribución',
    items: [
      'Importación y distribución de insumos industriales',
      'Importación y distribución de maquinaria y equipos',
      'Importación y distribución de materias primas químicas',
      'Importación y distribución de productos terminados industriales',
      'Importación y distribución de repuestos y partes',
    ],
  },
  {
    categoria: 'Construcción y servicios industriales',
    items: [
      'Construcción de edificios',
      'Construcción de obras de ingeniería civil',
      'Servicios de ingeniería y consultoría técnica',
      'Servicios de mantenimiento industrial',
      'Servicios de instalación de maquinaria y equipos',
      'Servicios de transporte de carga por carretera',
      'Servicios de almacenamiento y bodegaje',
    ],
  },
  {
    categoria: 'Minería y energía',
    items: [
      'Servicios de apoyo a la minería',
      'Generación, transmisión y distribución de energía eléctrica',
      'Servicios para la industria del petróleo y gas',
    ],
  },
  {
    categoria: 'Agricultura y agroindustria',
    items: [
      'Producción agrícola',
      'Producción ganadera',
      'Servicios agrícolas',
      'Procesamiento y conservación de alimentos',
    ],
  },
  {
    categoria: 'Otro',
    items: ['Otra actividad no listada'],
  },
]

/** Lista plana de todos los giros (para datalist). */
export const GIROS_PLANO: string[] = GIROS_SII.flatMap((g) => g.items)
