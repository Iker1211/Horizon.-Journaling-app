import { BigTheme, BlogEntry } from '../types';

export const INITIAL_THEMES: BigTheme[] = [
  {
    id: 'theme-salud',
    name: 'Salud & Vitalidad Radical',
    description: 'Optimización física, resistencia biológica, nutrición celular y energía sostenida para conquistar 2027.',
    color: 'pink',
    icon: 'HeartPulse',
    targetGoals2027: [
      'Grasa corporal al 12% y masa muscular magra sólida',
      'Correr media maratón en menos de 1h 45m',
      '8 horas de descanso de calidad no negociables'
    ],
    priority: 'vital',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'theme-tech',
    name: 'Maestría IA & Software',
    description: 'Creación de sistemas autónomos, orquestación de datos y liderazgo en la frontera tecnológica de 2027.',
    color: 'teal',
    icon: 'Cpu',
    targetGoals2027: [
      'Desplegar 3 arquitecturas de agentes autónomos a escala',
      'Dominar desarrollo agéntico y workflows complejos',
      'Lanzar producto open-source referente'
    ],
    priority: 'vital',
    createdAt: '2026-08-02T10:00:00Z',
    updatedAt: '2026-08-02T10:00:00Z'
  },
  {
    id: 'theme-riqueza',
    name: 'Libertad Financiera 2027',
    description: 'Construcción de activos diversificados, soberanía económica y runway ilimitado.',
    color: 'ochre',
    icon: 'Coins',
    targetGoals2027: [
      'Consolidar portafolio de inversión global',
      'Generar $5k/mes en flujos independientes',
      'Fondo de tranquilidad de 18 meses'
    ],
    priority: 'alta',
    createdAt: '2026-08-03T10:00:00Z',
    updatedAt: '2026-08-03T10:00:00Z'
  },
  {
    id: 'theme-mente',
    name: 'Paz Mental & Enfoque Profundo',
    description: 'Sobriedad de dopamina, lectura densa, presencia activa y desconexión intencional.',
    color: 'lavender',
    icon: 'Compass',
    targetGoals2027: [
      '100 libros profundos completados',
      'Cero doomscrolling y mañanas analógicas',
      'Retiro anual de introspección'
    ],
    priority: 'alta',
    createdAt: '2026-08-04T10:00:00Z',
    updatedAt: '2026-08-04T10:00:00Z'
  },
  {
    id: 'theme-expresion',
    name: 'Bitácora & Legado Personal',
    description: 'El wrapper reflexivo: documentar aprendizajes, escribir con claridad y tejer relaciones leales.',
    color: 'peach',
    icon: 'Feather',
    targetGoals2027: [
      'Publicar un ensayo reflexivo cada semana',
      'Compilar libro o diario de campo 2027',
      'Círculo de confianza de 5 personas de alto calibre'
    ],
    priority: 'media',
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: '2026-08-05T10:00:00Z'
  }
];

export const INITIAL_BLOG_ENTRIES: BlogEntry[] = [
  {
    id: 'blog-1',
    title: 'Estrategia 2027: El poder de los Wrappers sobre metas aisladas',
    summary: 'Las metas tradicionales fallan porque viven aisladas. Agrupar la vida en 5 pilares crea sinergia y un sistema indestructible.',
    content: `A menudo cometemos el error de fijar metas como islas flotantes: "ahorrar X dinero", "aprender un framework". Cuando la vida se complica, las islas se hunden una por una.

El enfoque hacia **2027** cambia las reglas del juego. Al organizar nuestros días en torno a **Wrappers**, cada sesión de trabajo, cada proyecto y cada entrada de bitácora alimenta un mismo vector de aceleración.

### Claves aprendidas:
1. **La inercia vence a la motivación**: Cuando tienes un Wrapper claro, el camino diario cobra sentido automático.
2. **Medir los días restantes genera urgencia sana**: Ver el calendario restar días no es estrés, es claridad. 2027 no es un concepto lejano; es la suma de los bloques que ejecutamos hoy.
3. **Todo se documenta**: Escribir en la bitácora bajo el Wrapper de Expresión convierte la experiencia en sabiduría acumulativa.`,
    themeId: 'theme-expresion',
    date: '2026-09-01',
    tags: ['Estrategia', 'Sistemas', 'Visión 2027'],
    readTimeMinutes: 3,
    createdAt: '2026-09-01T20:00:00Z',
    updatedAt: '2026-09-01T20:00:00Z'
  },
  {
    id: 'blog-2',
    title: 'Construyendo con Modelos Autónomos: Diario de Arquitectura',
    summary: 'Explorando cómo la orquestación agéntica redefine el desarrollo de software hacia el estándar del 2027.',
    content: `Hoy pasé 4 horas refinando un flujo de agentes coordinados. El paralelismo y la verificación en tiempo de ejecución reducen la fricción cognitiva a niveles antes impensables.

Para llegar a 2027 dominando la vanguardia, la clave no es memorizar sintaxis, sino entender la topología de los datos y cómo orquestar herramientas de manera declarativa y elegante: transformar la complejidad en bloques tangibles, visuales y confiables.`,
    themeId: 'theme-tech',
    date: '2026-08-28',
    tags: ['IA', 'Ingeniería', 'Arquitectura'],
    readTimeMinutes: 3,
    createdAt: '2026-08-28T18:30:00Z',
    updatedAt: '2026-08-28T18:30:00Z'
  },
  {
    id: 'blog-3',
    title: 'El protocolo de sueño y la moneda más valiosa de 2027',
    summary: 'Sin energía celular y claridad matutina, ningún plan a 2027 sobrevive. Mis ajustes en luz matutina y desconexión.',
    content: `Hemos normalizado el cansancio crónico. Pero en el Wrapper de Salud Radical, el sueño es el multiplicador absoluto. 

Tres cambios radicales aplicados:
- 10 minutos de luz solar directa antes de las pantallas.
- Cortar cafeína 10 horas antes de dormir.
- El teléfono duerme en otra habitación. El descanso ahora es sagrado.`,
    themeId: 'theme-salud',
    date: '2026-08-22',
    tags: ['Biohacking', 'Energía', 'Sueño'],
    readTimeMinutes: 2,
    createdAt: '2026-08-22T09:15:00Z',
    updatedAt: '2026-08-22T09:15:00Z'
  }
];
