# 💸 MiFuturo - Banca Digital Online

![Imagen Logo MiFuturo](./MiFuturo.png)

**MiFuturo** es una aplicación web de banca digital que permite a los usuarios gestionar sus cuentas personales, realizar transferencias y consultar movimientos financieros desde cualquier lugar de forma segura y sencilla.

## 🚀 Funcionalidades

- Registro e inicio de sesión de usuarios
- Consulta de movimientos bancarios
- Realización de transferencias
- Gestión de productos financieros (tarjetas, cuentas)
- Base de datos integrada con PostgreSQL

## 🧰 Tecnologías utilizadas

- **Backend:** Node.js, Express
- **Frontend:** Astro (generador de páginas estáticas)
- **Base de datos:** PostgreSQL (`pg`)
- **Arquitectura:** MVC (Modelo-Vista-Controlador)

## 🌐 Despliegue

La aplicación está actualmente desplegada en línea:  
🔗 [https://mifuturo.onreder.com](https://mifuturo.onrender.com)

## 📂 Estructura del proyecto

MiFuturo/
├── Controllers/       # Lógica de control de rutas
├── Logic/             # Reglas de negocio
├── Models/            # Modelos y conexión con base de datos
├── db/                # Pool único de PostgreSQL
├── routes/            # Rutas de la API
├── dist/              # Archivos de producción (Astro)
├── server.js          # Archivo principal del servidor
└── README.md          # Este archivo

