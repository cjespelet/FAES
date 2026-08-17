# 🎯 FAES - Guía de Configuración Rápida

## ✅ ¿Qué está completado?

Tu proyecto **FAES** está completamente configurado y listo para usar. Aquí está lo que se ha creado:

### 📦 Estructura del Proyecto

```
FAES/
├── src/
│   ├── app/
│   │   ├── core/               # Servicios y modelos principales
│   │   │   ├── services/       # Firebase services (Auth, Players, Tournaments, etc.)
│   │   │   ├── models/         # Interfaces TypeScript
│   │   │   └── guards/         # Auth guard para rutas protegidas
│   │   ├── features/           # Componentes de funcionalidades
│   │   │   ├── auth/           # Login y registro
│   │   │   ├── dashboard/      # Layout principal con navegación
│   │   │   ├── players/        # Gestión de jugadores
│   │   │   ├── tournaments/    # Gestión de torneos
│   │   │   ├── payments/       # Gestión de pagos
│   │   │   ├── reports/        # Reportes y exportación
│   │   │   └── settings/       # Configuración del equipo
│   │   └── app.routes.ts       # Configuración de rutas
│   └── environments/           # Configuración de Firebase
├── .github/workflows/          # GitHub Actions para deployment
└── public/                     # PWA assets (manifest, icons)
```

### 🚀 Tecnologías Implementadas

- ✅ **Angular 18** con Standalone Components
- ✅ **Angular Material** para UI/UX
- ✅ **Firebase** (Firestore + Authentication)
- ✅ **PWA** (Progressive Web App)
- ✅ **Service Worker** para funcionalidad offline
- ✅ **Routing** con lazy loading
- ✅ **Auth Guard** para proteger rutas
- ✅ **TypeScript** con models e interfaces

### 🔧 Servicios Implementados

1. **AuthService** - Autenticación de usuarios
2. **PlayerService** - CRUD de jugadores
3. **TournamentService** - CRUD de torneos y pagos
4. **InsuranceService** - Gestión de seguros
5. **TeamService** - Configuración del equipo

### 🎨 Componentes Creados

1. **Login** - Autenticación con tabs (Login/Registro)
2. **Dashboard** - Layout con sidenav y toolbar
3. **Home** - Dashboard con estadísticas
4. **Players** - Gestión de jugadores (placeholder)
5. **Tournaments** - Gestión de torneos (placeholder)
6. **Payments** - Registro de pagos (placeholder)
7. **Reports** - Exportación de reportes (placeholder)
8. **Settings** - Configuración del equipo (placeholder)

---

## 🔥 Próximos Pasos

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto llamado "FAES" (o el nombre que prefieras)
3. Habilita **Authentication**:
   - Ve a Build → Authentication
   - Haz clic en "Get Started"
   - Habilita "Email/Password"
4. Crea una base de datos **Firestore**:
   - Ve a Build → Firestore Database
   - Haz clic en "Create database"
   - Selecciona "Production mode" (por ahora)
   - Elige una ubicación (ej: southamerica-east1)

### 2. Configurar Firebase en el Proyecto

1. En Firebase Console, ve a Project Settings (ícono de engranaje)
2. Baja hasta "Your apps" y haz clic en el ícono web `</>`
3. Registra tu app con el nombre "FAES"
4. Copia la configuración de Firebase

5. **Actualiza estos archivos** con tu configuración:

#### `src/environments/environment.development.ts`

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "TU_PROJECT_ID.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT_ID.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
  }
};
```

#### `src/environments/environment.ts`

```typescript
export const environment = {
  production: true,
  firebase: {
    // MISMA CONFIGURACIÓN que development
  }
};
```

### 3. Configurar Reglas de Firestore

En Firebase Console → Firestore → Rules, pega estas reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cada usuario solo puede acceder a sus propios datos
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Haz clic en "Publish".

### 4. Probar Localmente

```bash
cd FAES
npm start
```

Abre tu navegador en `http://localhost:4200`

### 5. Crear Repositorio en GitHub

```bash
# Crea un repositorio nuevo en GitHub llamado "FAES"
# Luego ejecuta:

git remote add origin https://github.com/TU_USUARIO/FAES.git
git push -u origin main
```

### 6. Habilitar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: **GitHub Actions**
4. ¡Listo! El workflow se ejecutará automáticamente en cada push

---

## 📱 Estructura de Datos en Firestore

Así se organizarán tus datos:

```
users/
  └── {userId}/
      ├── settings/
      │   └── team              # Configuración del equipo
      ├── players/              # Colección de jugadores
      │   └── {playerId}
      ├── tournaments/          # Colección de torneos
      │   └── {tournamentId}
      ├── tournament-payments/  # Pagos de torneos
      │   └── {paymentId}
      └── insurance/            # Seguros
          └── {insuranceId}
```

---

## 🎯 Funcionalidades Pendientes de Implementar

Los placeholders están listos, pero necesitas completar:

1. **Players Component** - CRUD completo con tabla y diálogos
2. **Tournaments Component** - Crear/editar torneos con división de cuotas
3. **Payments Component** - Registrar pagos por jugador/cuota
4. **Reports Component** - Exportar PDF/Excel
5. **Settings Component** - Configurar equipo (nombre, logo, colores)

**Nota**: Los servicios ya están implementados, solo necesitas conectar los componentes.

---

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm start                    # Servidor de desarrollo
npm run build                # Build de producción
npm test                     # Ejecutar tests

# Git
git status                   # Ver cambios
git add .                    # Agregar cambios
git commit -m "mensaje"      # Commit
git push                     # Push a GitHub
```

---

## 🐛 Solución de Problemas

### Firebase no conecta

- Verifica que hayas actualizado las configuraciones en `environments/`
- Revisa la consola del navegador para errores
- Asegúrate de haber habilitado Authentication y Firestore

### Build falla

- Ejecuta `npm install` nuevamente
- Verifica que Node.js sea v22.14 o superior

### GitHub Pages no funciona

- Verifica que GitHub Actions esté habilitado
- Ve a Actions → Deploy to GitHub Pages → Ver el log
- Asegúrate de haber configurado Pages en Settings

---

## 📚 Recursos

- [Angular Documentation](https://angular.dev/)
- [Angular Material](https://material.angular.io/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [GitHub Pages](https://docs.github.com/en/pages)

---

## 🎉 ¡Listo!

Tu proyecto FAES está configurado y listo para desarrollar. Los próximos pasos son:

1. ✅ Configurar Firebase (5 minutos)
2. ✅ Probar la app localmente
3. ✅ Subir a GitHub
4. ✅ Empezar a desarrollar las funcionalidades

**¡Éxito con tu proyecto! ⚽🚀**
