# Horizon — Metas, Wrappers & Bitácora

Aplicación web para la planificación, orquestación y seguimiento de metas hacia el año **2027**, representada por el espíritu tenaz de la **Cabra de Fuego (丁未)** y construida bajo el sistema de diseño táctil y vibrante de **Clay** (`GEMINI.md`).

## 🌟 Características Principales

1. **Horizon & Panel General**:
   - Contador regresivo en tiempo real (días, horas, minutos, segundos) hacia el 1 de Enero de 2027.
   - Emblema táctil 3D modelado en arcilla de la **Cabra de Fuego** (Horizon Mascot).
   - Acceso rápido a Wrappers, métricas de ejecución y bitácora reciente.

2. **Wrappers**:
   - Los Wrappers actúan como pilares y contenedores de todas las entradas de bitácora e hitos hacia 2027.
   - CRUD completo con paleta de color Clay (Pink, Teal, Lavender, Peach, Ochre, Mint, Coral).

3. **Bitácora / Blog**:
   - Entradas estructuradas y filtrables por su Wrapper contenedor.
   - Búsqueda por texto y etiquetas.
   - Lector y editor de artículos dedicado con soporte para Markdown.

4. **Calendario de 365 Días & 4 Quarters (Q1, Q2, Q3, Q4)**:
   - Ciclo anual de 365 días estructurado desde el día en que el usuario empieza a utilizar la aplicación.
   - 4 Quarters ejecutivos (Q1, Q2, Q3, Q4) de alta intensidad con métricas de hitos y bitácoras asociadas.
   - Barra de progreso segmentada de los 4 cuartos con posición en tiempo real.
   - Matriz visual mensual con insignias de cuarto por celda (`Q1`, `Q2`, `Q3`, `Q4`) y conteo de días.
   - Inspector de detalle de día, calculadora de fechas clave y filtro de hitos por trimestre.

5. **Diseño 100% Responsivo & Navegación Móvil (Clash Royale Style)**:
   - En pantallas desktop: navegación superior tradicional.
   - En tablets y smartphones (`<= 860px`): barra inferior flotante táctil estilo videojuego móvil.

6. **Persistencia Híbrida & Base de Datos Supabase**:
   - Funciona sin configuración previa mediante `localStorage` en el navegador.
   - Conexión opcional a base de datos PostgreSQL Serverless en la nube con **Supabase** y Row Level Security (RLS).

## 🚀 Puesta en Marcha

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```
