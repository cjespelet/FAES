# ⚽ FAES - Gestión de Equipo de Fútbol

Aplicación web PWA para gestionar pagos, jugadores y torneos de tu equipo de fútbol.

## 🚀 Características

- ✅ Gestión de jugadores (DNI, teléfono, estado)
- ✅ Gestión de torneos (Apertura/Clausura)
- ✅ Control de pagos por cuota
- ✅ Seguros de jugadores
- ✅ Dashboard con estadísticas
- ✅ Reportes exportables (PDF/Excel)
- ✅ PWA - Funciona offline
- ✅ Multi-dispositivo con sincronización
- ✅ Autenticación de usuarios

## 🛠️ Tecnologías

- **Frontend**: Angular 18 (Standalone Components)
- **UI**: Angular Material
- **Backend**: Firebase (Firestore + Authentication)
- **PWA**: Service Worker
- **Hosting**: GitHub Pages

## 📋 Requisitos Previos

- Node.js 22.x o superior
- npm 10.x o superior
- Cuenta de Firebase (gratis)
- Cuenta de GitHub

## 🔧 Configuración

### 1. Instalar dependencias

\`\`\`bash
npm install
\`\`\`

### 2. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita **Authentication** → Email/Password
4. Crea una base de datos **Firestore** (modo producción)
5. Copia la configuración del proyecto

6. Actualiza los archivos de configuración:

**src/environments/environment.ts** y **src/environments/environment.development.ts**

\`\`\`typescript
export const environment = {
  production: true, // false para development
  firebase: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT_ID.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT_ID.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
  }
};
\`\`\`

### 3. Reglas de Seguridad de Firestore

En Firebase Console → Firestore → Reglas, configura:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
\`\`\`

## 🚀 Desarrollo

\`\`\`bash
npm start
\`\`\`

La aplicación estará disponible en `http://localhost:4200`

## 📦 Build para Producción

\`\`\`bash
npm run build
\`\`\`

Los archivos compilados estarán en `dist/faes/browser/`

## 🌐 Desplegar en GitHub Pages

### Opción 1: GitHub Actions (Automático)

1. Crea un repositorio en GitHub
2. Sube el código:

\`\`\`bash
git remote add origin https://github.com/TU_USUARIO/FAES.git
git branch -M main
git push -u origin main
\`\`\`

3. Configura GitHub Actions (archivo ya incluido en `.github/workflows/deploy.yml`)
4. Habilita GitHub Pages en Settings → Pages → Source: GitHub Actions

### Opción 2: Manual

\`\`\`bash
npm run build
npx angular-cli-ghpages --dir=dist/faes/browser
\`\`\`

La app estará disponible en: `https://TU_USUARIO.github.io/FAES/`

## 📱 Instalar como PWA

1. Abre la aplicación en Chrome/Edge
2. Haz clic en el ícono de instalar en la barra de direcciones
3. ¡Listo! Ya puedes usarla como app nativa

## 📖 Uso

### Primer Uso

1. Registra una cuenta nueva
2. Configura tu equipo en Configuración
3. Agrega jugadores
4. Crea torneos (Apertura/Clausura)
5. Registra pagos

### Gestión de Pagos

- Cada torneo se divide en 3 cuotas automáticamente
- Marca los pagos por jugador y cuota
- Genera reportes de morosos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT

## 👤 Autor

Tu Nombre

## 🙏 Agradecimientos

- Angular Team
- Firebase
- Material Design
