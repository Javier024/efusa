EFUSA – Sistema de Gestión Deportiva

EFUSA es una aplicación web desarrollada con HTML, CSS (Tailwind) y JavaScript, conectada a una API propia, diseñada para facilitar la gestión administrativa de una escuela de fútbol.

El sistema permite llevar el control de jugadores, pagos, estados, alertas y comunicación vía WhatsApp, de forma simple, rápida y accesible desde cualquier navegador.

🚀 Funcionalidades principales
👥 Gestión de jugadores

Registro, edición y eliminación de jugadores

Información completa:

Nombre

Categoría

Mensualidad

Acudiente

Teléfono

Dirección

Tipo de sangre

Estado Activo / Inactivo

💰 Gestión de pagos

Registro de pagos y abonos

Asociación de pagos a cada jugador

Historial de pagos

Preparado para cálculo de deuda mensual

🚨 Alertas automáticas

Identificación de jugadores con pagos pendientes

Preparado para notificaciones visuales y WhatsApp

📲 Integración con WhatsApp

Envío de mensajes automáticos al acudiente

Recordatorios de pago

Confirmación de pagos registrados

🛠 Tecnologías utilizadas

Frontend

HTML5

Tailwind CSS

JavaScript (ES Modules)

Backend

API REST propia (Node / Serverless)

Endpoints:

/api/jugadores

/api/pagos

/api/alertas

Otros

Fetch API

Arquitectura modular

Listo para despliegue en Vercel

📂 Estructura del proyecto
efusa/
│
├── index.html
├── jugadores.html
├── pagos.html
├── alerta.html
│
├── recursos/
│   └── js/
│       ├── api.js
│       ├── jugadores.js
│       ├── pagos.js
│       ├── alerta.js
│       ├── configuracion.js
│       └── whatsapp.js
│
├── api/
│   ├── jugadores.js
│   ├── pagos.js
│   └── alertas.js
│
└── README.md

⚙️ Instalación y uso

1️⃣ Clona el repositorio

git clone https://github.com/Javier024/efusa.git


2️⃣ Entra al proyecto

cd efusa


3️⃣ Ejecuta el proyecto (modo local)

Usa Live Server o

Servidor local compatible con rutas /api

4️⃣ Abre en el navegador

http://localhost:3000

📈 Estado del proyecto

✅ Gestión de jugadores
✅ Registro de pagos
✅ Estructura API
🚧 Cálculo automático de deuda
🚧 Alertas avanzadas
🚧 Reportes mensuales

🎯 Objetivo del proyecto

Crear un sistema administrativo real, práctico y fácil de usar para escuelas deportivas, eliminando el uso de cuadernos o Excel y centralizando toda la información en una plataforma web moderna.

👨‍💻 Autor

Javier Guzmán
Ingeniero de Sistemas
Desarrollador Web

📌 Proyecto personal / académico
📌 En constante mejora