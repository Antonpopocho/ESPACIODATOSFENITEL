# Manual de Despliegue - FENITEL Espacio de Datos

## Requisitos del Sistema

- Docker & Docker Compose
- 2GB RAM mínimo
- 10GB espacio en disco
- Dominio con certificado SSL (HTTPS obligatorio)

## Estructura del Proyecto

```
/app/
├── backend/              # FastAPI backend
│   ├── server.py         # Aplicación principal
│   ├── requirements.txt  # Dependencias Python
│   └── .env              # Variables de entorno
├── frontend/             # React frontend
│   ├── src/              # Código fuente
│   ├── package.json      # Dependencias Node
│   └── .env              # Variables de entorno
├── storage/              # Almacenamiento de archivos
│   ├── datasets/         # Datasets CSV/JSON
│   ├── contracts/        # Contratos PDF
│   ├── evidence/         # Evidencias firmadas
│   └── exports/          # Expedientes ZIP
└── docker-compose.yml    # Configuración Docker
```

## Variables de Entorno

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=fenitel_data_space
JWT_SECRET=tu-clave-secreta-jwt-256bits
CORS_ORIGINS=https://tu-dominio.com
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://tu-dominio.com
```

## Docker Compose

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    restart: always

  backend:
    build: ./backend
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=fenitel_data_space
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./storage:/app/storage
    depends_on:
      - mongodb
    restart: always

  frontend:
    build: ./frontend
    environment:
      - REACT_APP_BACKEND_URL=https://api.tu-dominio.com
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: always

volumes:
  mongo_data:
```

## Pasos de Despliegue

### 1. Clonar y configurar
```bash
git clone <repo>
cd fenitel-espacio-datos
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Editar variables de entorno
```

### 2. Construir y levantar
```bash
docker-compose build
docker-compose up -d
```

### 3. Crear usuario promotor inicial
```bash
docker-compose exec backend python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone

async def create_promotor():
    client = AsyncIOMotorClient('mongodb://mongodb:27017')
    db = client['fenitel_data_space']
    
    user = {
        'id': str(uuid.uuid4()),
        'email': 'admin@fenitel.es',
        'name': 'FENITEL Administrador',
        'organization': 'FENITEL',
        'nif': 'G12345678',
        'password_hash': bcrypt.hashpw('CambiarContraseña!'.encode(), bcrypt.gensalt()).decode(),
        'role': 'promotor',
        'incorporation_status': 'effective',
        'contract_signed': True,
        'payment_status': 'paid',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'is_provider': True
    }
    await db.users.insert_one(user)
    print('Promotor creado')

asyncio.run(create_promotor())
"
```

### 4. Verificar servicios
```bash
docker-compose ps
curl https://tu-dominio.com/api/
```

## Backup y Restauración

### Backup MongoDB
```bash
docker-compose exec mongodb mongodump --out /backup
docker cp $(docker-compose ps -q mongodb):/backup ./backup_$(date +%Y%m%d)
```

### Backup Storage
```bash
tar -czvf storage_backup_$(date +%Y%m%d).tar.gz ./storage
```

### Restaurar
```bash
docker-compose exec mongodb mongorestore /backup
tar -xzvf storage_backup.tar.gz
```

## Seguridad

- ✅ HTTPS obligatorio (configurar en nginx)
- ✅ JWT con expiración de 24h
- ✅ Contraseñas hasheadas con bcrypt
- ✅ CORS configurado
- ✅ Logs inmutables para auditoría

## Monitorización

```bash
# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Ver estadísticas
docker stats
```
