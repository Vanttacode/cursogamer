# 🚀 Vantta Academy Platform

![Vantta Academy Banner](https://vanttacode.cl/og-image.jpg) 
> **Infraestructura educativa tecnológica desde Magallanes para el mundo.**
> Plataforma oficial para la gestión de talleres presenciales, cursos y portafolios de alumnos de Vantta Code.

## 🌟 Sobre el Proyecto

**Vantta Academy** nace como una iniciativa para democratizar el acceso a la programación y el desarrollo de videojuegos en el extremo sur de Chile. 

Actualmente, el proyecto funciona como una **Landing Page de Alto Rendimiento** para la convocatoria del "Taller de Verano: Videojuegos Web", pero su arquitectura está diseñada para escalar hacia una academia digital completa.

### 🎯 Objetivos a Futuro
* **Catálogo de Cursos:** Soporte para múltiples convocatorias simultáneas (Presencial / Online).
* **Hall of Fame:** Portafolio automatizado donde los alumnos publican sus proyectos finales.
* **Vantta ID:** Login para alumnos con acceso a recursos exclusivos.

---

## 🛠️ Stack Tecnológico

El proyecto utiliza una arquitectura moderna, rápida y escalable (JAMstack + BaaS).

### Core
* **[Astro 5.0](https://astro.build/):** Framework principal. Renderizado estático (SSG) para velocidad máxima y "Islas" para interactividad.
* **[React](https://react.dev/):** Biblioteca UI para componentes interactivos (Formularios, Dashboard, Game Engine).
* **[TypeScript](https://www.typescriptlang.org/):** Tipado estático para robustez y mantenibilidad.

### Estilos & UI
* **[Tailwind CSS 4.0](https://tailwindcss.com/):** Estilizado utilitario.
* **[Framer Motion](https://www.framer.com/motion/):** Animaciones fluidas y micro-interacciones.
* **Diseño:** Estética "Cyberpunk / Hacker" personalizada (Jules Theme).

### Backend & Data (Serverless)
* **[Supabase](https://supabase.com/):** Base de datos PostgreSQL, Autenticación y Storage.
* **[Vercel](https://vercel.com/):** Hosting y despliegue continuo (CI/CD).
* **[Cloudflare](https://www.cloudflare.com/):** Gestión de DNS y seguridad.

---

## 📂 Estructura del Proyecto

```bash
src/
├── components/
│   ├── admin/       # Panel de Control (React) protegido
│   ├── game/        # Motor del juego demo (Canvas + React)
│   ├── layout/      # Header, Footer, Base
│   ├── sections/    # Secciones de la Landing (Hero, Temario, etc.)
│   └── ui/          # Componentes reutilizables (Botones, Badges)
├── layouts/         # Layout principal (Estilos globales, Meta tags)
├── lib/             # Clientes de Supabase y utilidades
├── pages/
│   ├── admin/       # Rutas del Panel de Administración
│   ├── api/         # Endpoints Server-Side (API Routes)
│   └── index.astro  # Página principal (Landing actual)
└── styles/          # CSS Global y configuraciones de Tailwind
🔐 Panel de Administración (Admin Dashboard)
El sistema incluye un CMS a medida para la gestión operativa de los talleres.

Ruta: /admin

Seguridad: Autenticación vía Cookies (HttpOnly) + Supabase Service Role (Server-side).

Funcionalidades:

📊 Overview: Métricas en tiempo real (Cupos totales, inscritos, recaudación).

📝 Gestión de Reservas: Aprobación/Rechazo de cupos.

📎 Visor de Comprobantes: Acceso seguro a archivos en Supabase Storage.

📞 CRM Ligero: Acceso directo a WhatsApp y Email de tutores.

🚀 Instalación y Desarrollo
Clonar el repositorio

Bash
git clone [https://github.com/tu-usuario/vantta-academy.git](https://github.com/tu-usuario/vantta-academy.git)
cd vantta-academy
Instalar dependencias

Bash
npm install
Configurar Variables de Entorno Crea un archivo .env en la raíz con las siguientes llaves (solicitar al administrador):

Fragmento de código
PUBLIC_SUPABASE_URL=tu_url_publica
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_secreta
Iniciar servidor local

Bash
npm run dev
📦 Despliegue
El proyecto está configurado para desplegarse automáticamente en Vercel al hacer push a la rama main.

Production: https://academy.vanttacode.cl

DNS: Gestionados vía Cloudflare.

🤝 Contribución
Este proyecto es propiedad de Vantta Code. Desarrollado con ❤️ y mucho café en Punta Arenas, Chile.

Lead Developer: Nicolás Vera.


***