# Manual de Despliegue - FENITEL Espacio de Datos
# Servidor: 10.10.114.29 | Usuario: admin

## Requisitos del Sistema

| Componente | Versión | Comando verificación |
|------------|---------|---------------------|
| **Node.js** | v20.20.1 (LTS) | `node --version` |
| **npm** | 10.8.2 | `npm --version` |
| **yarn** | 1.22.22 | `yarn --version` |
| **Python** | 3.11+ | `python3 --version` |
| **MongoDB** | 6.0+ | `mongod --version` |
| **RAM** | 2GB mínimo | |
| **Disco** | 10GB mínimo | |

---

## 1. Preparación del Servidor

### 1.1 Conectar al servidor
```bash
ssh admin@10.10.114.29
```

### 1.2 Actualizar sistema (Ubuntu/Debian)
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar Node.js 20.x
```bash
# Usando NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version   # Debe mostrar v20.x.x
npm --version    # Debe mostrar 10.x.x

# Instalar yarn
sudo npm install -g yarn
```

### 1.4 Instalar Python 3.11+
```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version
```

### 1.5 Instalar MongoDB 6.0
```bash
# Importar clave GPG
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Agregar repositorio (Ubuntu 22.04)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Instalar
sudo apt update
sudo apt install -y mongodb-org

# Iniciar y habilitar
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```

---

## 2. Estructura del Proyecto

```
/home/admin/fenitel-espacio-datos/
├── backend/                    # FastAPI backend
│   ├── server.py               # Aplicación principal (~2100 líneas)
│   ├── services/
│   │   └── certificate_service.py  # Generador de PDFs
│   ├── requirements.txt        # Dependencias Python
│   └── .env                    # Variables de entorno
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.js              # Rutas principales
│   │   ├── components/         # Componentes UI
│   │   ├── pages/              # Vistas
│   │   └── lib/                # Utilidades y API
│   ├── package.json            # Dependencias Node
│   └── .env                    # Variables de entorno
├── storage/                    # Almacenamiento persistente
│   ├── datasets/               # Datasets CSV/JSON
│   ├── contracts/              # Contratos PDF firmados
│   ├── evidence/               # Evidencias PDF
│   │   └── dataset_publications/
│   └── exports/                # Expedientes ZIP
└── docs/                       # Documentación
```

---

## 3. Despliegue Manual (Sin Docker)

### 3.1 Clonar/Copiar proyecto
```bash
cd /home/admin
# Opción A: Clonar desde Git
git clone <tu-repositorio> fenitel-espacio-datos

# Opción B: Copiar desde local
scp -r /app admin@10.10.114.29:/home/admin/fenitel-espacio-datos
```

### 3.2 Configurar Backend

```bash
cd /home/admin/fenitel-espacio-datos/backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# Crear archivo .env
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=fenitel_data_space
JWT_SECRET=FenitelSecretKey2025SuperSeguro256bits
CORS_ORIGINS=http://10.10.114.29:3000,http://10.10.114.29
EOF
```

### 3.3 Configurar Frontend

```bash
cd /home/admin/fenitel-espacio-datos/frontend

# Instalar dependencias
yarn install

# Crear archivo .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://10.10.114.29:8001
EOF
```

### 3.4 Crear directorios de almacenamiento
```bash
cd /home/admin/fenitel-espacio-datos
mkdir -p storage/{datasets,contracts,evidence/dataset_publications,exports}
chmod -R 755 storage
```

---

## 4. Ejecutar Servicios

### 4.1 Backend (FastAPI)
```bash
cd /home/admin/fenitel-espacio-datos/backend
source venv/bin/activate

# Desarrollo
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Producción (con gunicorn)
pip install gunicorn
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001
```

### 4.2 Frontend (React)
```bash
cd /home/admin/fenitel-espacio-datos/frontend

# Desarrollo
yarn start

# Producción (build estático)
yarn build
# Servir con nginx o serve
npm install -g serve
serve -s build -l 3000
```

---

## 5. Configuración con Systemd (Producción)

### 5.1 Servicio Backend
```bash
sudo cat > /etc/systemd/system/fenitel-backend.service << 'EOF'
[Unit]
Description=FENITEL Espacio de Datos - Backend
After=network.target mongod.service

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/fenitel-espacio-datos/backend
Environment=PATH=/home/admin/fenitel-espacio-datos/backend/venv/bin
ExecStart=/home/admin/fenitel-espacio-datos/backend/venv/bin/gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable fenitel-backend
sudo systemctl start fenitel-backend
```

### 5.2 Servicio Frontend
```bash
sudo cat > /etc/systemd/system/fenitel-frontend.service << 'EOF'
[Unit]
Description=FENITEL Espacio de Datos - Frontend
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/fenitel-espacio-datos/frontend
ExecStart=/usr/bin/npx serve -s build -l 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable fenitel-frontend
sudo systemctl start fenitel-frontend
```

### 5.3 Verificar servicios
```bash
sudo systemctl status fenitel-backend
sudo systemctl status fenitel-frontend
sudo systemctl status mongod
```

---

## 6. Configuración Nginx (Proxy Inverso)

### 6.1 Instalar Nginx
```bash
sudo apt install -y nginx
```

### 6.2 Configuración
```bash
sudo cat > /etc/nginx/sites-available/fenitel << 'EOF'
server {
    listen 80;
    server_name 10.10.114.29;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Para subida de archivos grandes
        client_max_body_size 50M;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/fenitel /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 6.3 Actualizar Frontend .env para Nginx
```bash
# Si usas nginx como proxy
cat > /home/admin/fenitel-espacio-datos/frontend/.env << 'EOF'
REACT_APP_BACKEND_URL=http://10.10.114.29
EOF

# Rebuild frontend
cd /home/admin/fenitel-espacio-datos/frontend
yarn build
sudo systemctl restart fenitel-frontend
```

---

## 7. Crear Usuario Promotor Inicial

```bash
cd /home/admin/fenitel-espacio-datos/backend
source venv/bin/activate

python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone

async def create_promotor():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['fenitel_data_space']
    
    # Verificar si ya existe
    existing = await db.users.find_one({"email": "admin@fenitel.es"})
    if existing:
        print("El usuario promotor ya existe")
        return
    
    password = "FenitelAdmin2025!"
    user = {
        "id": str(uuid.uuid4()),
        "email": "admin@fenitel.es",
        "name": "FENITEL Administrador",
        "organization": "FENITEL",
        "nif": "G12345678",
        "phone": "+34 600 000 000",
        "address": "Madrid, España",
        "password_hash": bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(),
        "role": "promotor",
        "incorporation_status": "effective",
        "contract_signed": True,
        "payment_status": "paid",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_provider": True,
        "identity_evidence_id": None,
        "contract_reference": None,
        "registration_certificate_url": None,
        "registration_certificate_hash": None
    }
    
    await db.users.insert_one(user)
    print(f"Promotor creado exitosamente")
    print(f"  Email: admin@fenitel.es")
    print(f"  Password: {password}")
    
    client.close()

asyncio.run(create_promotor())
EOF
```

---

## 8. Verificación del Despliegue

### 8.1 Verificar servicios
```bash
# MongoDB
mongo --eval "db.adminCommand('ping')"

# Backend
curl http://10.10.114.29:8001/api/

# Frontend
curl http://10.10.114.29:3000

# Con Nginx
curl http://10.10.114.29/api/
```

### 8.2 Test de login
```bash
curl -X POST http://10.10.114.29/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fenitel.es","password":"FenitelAdmin2025!"}'
```

---

## 9. Backup y Restauración

### 9.1 Script de backup completo
```bash
cat > /home/admin/backup-fenitel.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/admin/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --db fenitel_data_space --out $BACKUP_DIR/mongo_$DATE

# Backup Storage
tar -czvf $BACKUP_DIR/storage_$DATE.tar.gz /home/admin/fenitel-espacio-datos/storage

# Limpiar backups antiguos (más de 30 días)
find $BACKUP_DIR -mtime +30 -delete

echo "Backup completado: $DATE"
EOF

chmod +x /home/admin/backup-fenitel.sh
```

### 9.2 Programar backup diario (cron)
```bash
crontab -e
# Agregar línea:
0 2 * * * /home/admin/backup-fenitel.sh >> /home/admin/backup.log 2>&1
```

### 9.3 Restaurar backup
```bash
# MongoDB
mongorestore --db fenitel_data_space /home/admin/backups/mongo_FECHA/fenitel_data_space

# Storage
tar -xzvf /home/admin/backups/storage_FECHA.tar.gz -C /
```

---

## 10. Logs y Monitorización

### 10.1 Ver logs
```bash
# Backend
sudo journalctl -u fenitel-backend -f

# Frontend
sudo journalctl -u fenitel-frontend -f

# MongoDB
sudo journalctl -u mongod -f

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 10.2 Monitorización básica
```bash
# Estado de servicios
sudo systemctl status fenitel-backend fenitel-frontend mongod nginx

# Uso de recursos
htop
df -h
free -m
```

---

## 11. Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (si usas SSL)
sudo ufw enable
sudo ufw status
```

---

## 12. Credenciales de Acceso

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Promotor** | admin@fenitel.es | FenitelAdmin2025! |
| **Miembro Demo** | empresa@demo.com | Demo123456! |

---

## 13. URLs de Acceso

| Servicio | URL |
|----------|-----|
| **Aplicación** | http://10.10.114.29 |
| **API Backend** | http://10.10.114.29/api |
| **Catálogo DCAT-AP** | http://10.10.114.29/api/datasets/catalog |

---

## 14. Solución de Problemas

### Backend no inicia
```bash
# Ver logs detallados
sudo journalctl -u fenitel-backend -n 100

# Verificar dependencias
cd /home/admin/fenitel-espacio-datos/backend
source venv/bin/activate
pip install -r requirements.txt

# Verificar conexión MongoDB
python3 -c "from motor.motor_asyncio import AsyncIOMotorClient; print(AsyncIOMotorClient('mongodb://localhost:27017').server_info())"
```

### Frontend no carga
```bash
# Verificar build
cd /home/admin/fenitel-espacio-datos/frontend
yarn build

# Verificar REACT_APP_BACKEND_URL
cat .env
```

### Error de CORS
```bash
# Verificar CORS_ORIGINS en backend/.env
# Debe incluir la URL del frontend
CORS_ORIGINS=http://10.10.114.29,http://10.10.114.29:3000
```

---

## 15. Actualización de la Aplicación

```bash
# 1. Detener servicios
sudo systemctl stop fenitel-backend fenitel-frontend

# 2. Backup antes de actualizar
/home/admin/backup-fenitel.sh

# 3. Actualizar código
cd /home/admin/fenitel-espacio-datos
git pull origin main  # Si usas git

# 4. Actualizar dependencias backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# 5. Actualizar dependencias frontend
cd ../frontend
yarn install
yarn build

# 6. Reiniciar servicios
sudo systemctl start fenitel-backend fenitel-frontend
```

---

**Documento generado:** 25/03/2026  
**Versión:** 2.0  
**Servidor destino:** 10.10.114.29  
**Usuario:** admin
