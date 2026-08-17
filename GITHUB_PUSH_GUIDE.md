# 🚀 Guía Rápida: Subir FAES a GitHub

## Pasos en tu Computadora

### 1. Asegúrate de tener instalado:
- Git: https://git-scm.com/downloads
- Node.js v22+: https://nodejs.org/

### 2. Crea el repositorio en GitHub:
- Ve a https://github.com/new
- Repository name: **FAES**
- ⚠️ NO marques "Initialize with README"
- Haz clic en "Create repository"

### 3. En tu terminal/cmd, ejecuta estos comandos:

```bash
# Ir a donde quieras crear el proyecto (ej: Documentos)
cd ~/Documentos  # En Mac/Linux
# o
cd %USERPROFILE%\Documents  # En Windows

# Descargar el proyecto desde este chat
# (Si no puedes descargar el .tar.gz, usa la Opción B)

# Descomprimir
tar -xzf FAES-project.tar.gz
cd FAES

# Instalar dependencias
npm install

# Inicializar Git
git init
git add .
git commit -m "Initial commit: FAES"

# Conectar con GitHub
git branch -M main
git remote add origin https://github.com/cjespelet/FAES.git

# Subir a GitHub
git push -u origin main
```

### 4. Configurar Firebase:

Sigue las instrucciones en `SETUP.md` del proyecto.

---

## 🎯 ¿No puedes descargar el archivo?

Usa la **Opción B** (te la explico abajo)
