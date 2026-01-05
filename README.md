# DashboardVulnerabilidades-API

API REST para gestión y automatización de escaneos de seguridad con Snyk. Sistema completo de análisis de vulnerabilidades con escaneos automáticos programados y manuales bajo demanda.

## 🚀 Características

- **Clonado Automático**: Solo proporciona la URL del repositorio, la API lo clona automáticamente
- **Escaneos Automáticos**: Cron job configurable para escaneos periódicos de repositorios
- **Escaneos Manuales**: Endpoint para ejecutar escaneos bajo demanda
- **Gestión de Repositorios**: CRUD completo para configurar repositorios a escanear
- **Actualización Git**: Cada escaneo actualiza el código con `git pull` automáticamente
- **Integración Snyk CLI**: Ejecución nativa de comandos Snyk
- **Notificaciones Discord**: Alertas automáticas con embeds coloridos según severidad
- **Persistencia MongoDB**: Almacenamiento de reportes y configuraciones
- **Documentación Swagger**: API interactiva en `/api-docs`
- **Gestión Interna**: La API maneja la estructura de carpetas y repositorios automáticamente

## 📋 Requisitos Previos

- **Node.js** (v18 o superior)
- **MongoDB** (local o remoto)
- **Snyk CLI** instalado globalmente: `npm install -g snyk`
- **Snyk Token**: Obtener desde [Snyk Account Settings](https://app.snyk.io/account)

## 🔧 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd DashboardVulnerabilidades-API

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (SNYK_TOKEN, DISCORD_WEBHOOK_URL, etc.)

# Autenticar Snyk CLI
snyk auth

# Iniciar en desarrollo
npm run dev
```

**Nota**: La API creará automáticamente una carpeta `repositories/` donde clonará todos los repositorios que agregues.

## ⚙️ Variables de Entorno

**IMPORTANTE**: El `SNYK_TOKEN` es **obligatorio**. La aplicación no iniciará sin él.

```env
# Servidor
PORT=3000

# Base de Datos
MONGO_URI=mongodb://localhost:27017/snyk_reports_db

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Snyk (OBLIGATORIO)
# Obtener desde: https://app.snyk.io/account
SNYK_TOKEN=your_snyk_token_here

# Cron Job
ENABLE_CRON=true
CRON_SCHEDULE=0 2 * * *  # Todos los días a las 2:00 AM
```

### Formato Cron Schedule

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── día del mes (1 - 31)
│ │ │ ┌───────────── mes (1 - 12)
│ │ │ │ ┌───────────── día de la semana (0 - 6) (Domingo = 0)
│ │ │ │ │
* * * * *
```

**Ejemplos:**
- `0 2 * * *` - Todos los días a las 2:00 AM
- `0 */6 * * *` - Cada 6 horas
- `0 9 * * 1` - Todos los lunes a las 9:00 AM
- `*/30 * * * *` - Cada 30 minutos

## 📚 Endpoints API

### Health Check
```bash
GET /health
```

### Reportes (Webhook)
```bash
# Recibir reporte desde pipeline CI/CD
POST /api/reports/webhook
Content-Type: application/json
Body: <snyk-json-output>
```

### Escaneos

```bash
# Escaneo manual de un repositorio específico
POST /api/scans/manual
{
  "repositoryName": "backend-api"
}

# Escanear todos los repositorios habilitados
POST /api/scans/all

# Listar repositorios configurados
GET /api/scans/repositories

# Agregar nuevo repositorio (lo clona automáticamente y hace primer escaneo)
POST /api/scans/repositories
{
  "name": "backend-api",
  "url": "https://github.com/usuario/backend-api.git",
  "branch": "main",
  "enabled": true
}

# Actualizar repositorio
PUT /api/scans/repositories/:name
{
  "enabled": false
}

# Eliminar repositorio
DELETE /api/scans/repositories/:name
```

### Vulnerabilidades
```bash
# Listar vulnerabilidades (mock)
GET /api/vulnerabilities

# Crear vulnerabilidad (mock)
POST /api/vulnerabilities
```

## 🔄 Flujo de Trabajo

### Flujo de Alta de Repositorio
1. Cliente hace `POST /api/scans/repositories` con `name` y `url`
2. API clona el repositorio en `./repositories/<name>/`
3. Guarda configuración en MongoDB con `cloned: true`
4. **Ejecuta primer escaneo automáticamente**
5. Retorna resultado con datos del repositorio y primer escaneo

### Flujo Automático (Cron)
1. **Cron Job** se ejecuta según `CRON_SCHEDULE`
2. Obtiene todos los repositorios con `enabled: true`
3. Para cada repositorio:
   - Ejecuta `git pull` para actualizar código
   - Ejecuta `snyk test --json --all-projects`
4. Procesa resultados y guarda en MongoDB
5. Envía notificación a Discord con resumen

### Flujo Manual
1. Cliente hace `POST /api/scans/manual` con `repositoryName`
2. API valida que el repositorio exista, esté habilitado y clonado
3. Ejecuta `git pull` para actualizar
4. Ejecuta escaneo Snyk
5. Retorna resultado inmediato
6. Guarda reporte y notifica Discord

### Flujo Webhook (CI/CD)
1. Pipeline ejecuta `snyk test --json > report.json`
2. Pipeline hace `POST /api/reports/webhook` con el JSON
3. API procesa y almacena
4. Notifica Discord

## 🗄️ Modelos de Datos

### Repository
```typescript
{
  name: string;        // Identificador único
  url: string;         // URL del repositorio Git
  branch: string;      // Rama a escanear (default: "main")
  enabled: boolean;    // Si está habilitado para escaneos automáticos
  cloned: boolean;     // Si el repositorio está clonado localmente
  lastScan?: Date;     // Fecha del último escaneo
}
```

### SnykReport
```typescript
{
  projectNames: string[];
  scanDate: Date;
  isClean: boolean;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  vulnerabilities: Array<{
    snykId: string;
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    packageName: string;
    version: string;
    from: string[];
  }>;
  rawData: any;  // JSON completo de Snyk
}
```

## 🎯 Ejemplos de Uso

### Agregar Repositorios (Clonado y Escaneo Automático)

```bash
# Agregar repositorio (se clona automáticamente y se escanea)
curl -X POST http://localhost:3000/api/scans/repositories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "backend-api",
    "url": "https://github.com/usuario/backend-api.git",
    "branch": "main",
    "enabled": true
  }'

# Agregar más repositorios
curl -X POST http://localhost:3000/api/scans/repositories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "frontend-app",
    "url": "https://github.com/usuario/frontend-app.git",
    "branch": "develop",
    "enabled": true
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Repositorio agregado y escaneado exitosamente",
  "data": {
    "repository": {
      "name": "backend-api",
      "url": "https://github.com/usuario/backend-api.git",
      "branch": "main",
      "enabled": true,
      "cloned": true
    },
    "firstScan": {
      "repository": "backend-api",
      "success": true,
      "reportId": "507f1f77bcf86cd799439011",
      "scannedAt": "2025-12-31T12:00:00.000Z"
    },
    "path": "C:/path/to/api/repositories/backend-api"
  }
}
```

### Ejecutar Escaneo Manual

```bash
# Escanear un repositorio específico
curl -X POST http://localhost:3000/api/scans/manual \
  -H "Content-Type: application/json" \
  -d '{"repositoryName": "backend-api"}'

# Escanear todos
curl -X POST http://localhost:3000/api/scans/all
```

### Deshabilitar Repositorio Temporalmente

```bash
curl -X PUT http://localhost:3000/api/scans/repositories/backend-api \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

## 🔐 Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configurado para permitir orígenes específicos
- **Variables de Entorno**: Credenciales nunca hardcodeadas
- **Validación**: Checks de entrada en todos los endpoints

## 📊 Notificaciones Discord

Las notificaciones incluyen:
- 🚨 **Rojo** (Critical): Vulnerabilidades críticas detectadas
- ⛔ **Naranja** (High): Vulnerabilidades altas
- ⚠️ **Amarillo** (Medium): Vulnerabilidades medias
- 🔵 **Azul** (Low): Vulnerabilidades bajas
- ✅ **Verde**: Sin vulnerabilidades

Cada notificación incluye:
- Proyectos escaneados
- Total de vulnerabilidades
- Desglose por severidad
- Timestamp del escaneo

## 🛠️ Desarrollo

```bash
# Modo desarrollo con hot reload
npm run dev

# Verificar Snyk CLI
snyk --version

# Probar autenticación Snyk
snyk auth

# Ver logs de MongoDB
# Conectar a mongo y ejecutar:
use snyk_reports_db
db.snykReports.find().pretty()
db.repositories.find().pretty()
```

## 📝 Notas Importantes

1. **Snyk Token**: Asegúrate de tener un token válido en `.env`
2. **URLs de Repositorios**: Deben ser URLs Git válidas (HTTPS o SSH)
3. **Acceso Git**: El servidor debe tener acceso a los repositorios (públicos o con credenciales configuradas)
4. **MongoDB**: Debe estar corriendo antes de iniciar la API
5. **Cron Timezone**: Configurado para `America/Argentina/Buenos_Aires`
6. **Carpeta repositories/**: Se crea automáticamente y está en `.gitignore`
7. **Primer Escaneo**: Al agregar un repositorio, se ejecuta automáticamente el primer escaneo

## 🐛 Troubleshooting

### Snyk CLI no detectado
```bash
npm install -g snyk
snyk auth
```

### Error de autenticación Snyk
```bash
# Re-autenticar
snyk auth

# Verificar token
echo $SNYK_TOKEN  # Linux/Mac
echo %SNYK_TOKEN%  # Windows
```

### MongoDB no conecta
```bash
# Verificar que MongoDB esté corriendo
# Windows:
net start MongoDB

# Linux/Mac:
sudo systemctl start mongod
```

## 📄 Licencia

ISC
