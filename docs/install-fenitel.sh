#!/bin/bash
#===============================================================================
# FENITEL Espacio de Datos - Script de Instalación Automatizada
# Servidor: 10.10.114.29 | Usuario: admin
# Versión: 2.0 | Fecha: 25/03/2026
#===============================================================================

set -e  # Salir si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

# Configuración
APP_USER="admin"
APP_DIR="/home/${APP_USER}/fenitel-espacio-datos"
SERVER_IP="10.10.114.29"
MONGO_DB="fenitel_data_space"
JWT_SECRET="FenitelSecretKey2025SuperSeguro256bits$(date +%s)"
PROMOTOR_EMAIL="admin@fenitel.es"
PROMOTOR_PASSWORD="FenitelAdmin2025!"

#===============================================================================
# Funciones auxiliares
#===============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script debe ejecutarse como root (sudo)"
        exit 1
    fi
}

check_ubuntu() {
    if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
        log_warn "Este script está optimizado para Ubuntu. Puede requerir ajustes en otras distribuciones."
    fi
}

#===============================================================================
# 1. Actualizar sistema
#===============================================================================

update_system() {
    log_info "Actualizando sistema..."
    apt update && apt upgrade -y
    apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates git
    log_success "Sistema actualizado"
}

#===============================================================================
# 2. Instalar Node.js 20.x
#===============================================================================

install_nodejs() {
    log_info "Instalando Node.js 20.x..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        if [[ $NODE_VERSION == v20* ]]; then
            log_success "Node.js $NODE_VERSION ya está instalado"
            return
        fi
    fi
    
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Instalar yarn globalmente
    npm install -g yarn
    
    log_success "Node.js $(node --version) instalado"
    log_success "npm $(npm --version) instalado"
    log_success "yarn $(yarn --version) instalado"
}

#===============================================================================
# 3. Instalar Python 3.11+
#===============================================================================

install_python() {
    log_info "Instalando Python 3.11+..."
    
    apt install -y python3 python3-pip python3-venv python3-dev
    
    log_success "Python $(python3 --version) instalado"
}

#===============================================================================
# 4. Instalar MongoDB 6.0
#===============================================================================

install_mongodb() {
    log_info "Instalando MongoDB 6.0..."
    
    if systemctl is-active --quiet mongod; then
        log_success "MongoDB ya está instalado y corriendo"
        return
    fi
    
    # Importar clave GPG
    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg
    
    # Detectar versión de Ubuntu
    UBUNTU_CODENAME=$(lsb_release -cs)
    
    # Agregar repositorio
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    
    apt update
    apt install -y mongodb-org
    
    # Iniciar y habilitar
    systemctl start mongod
    systemctl enable mongod
    
    # Esperar a que MongoDB esté listo
    sleep 3
    
    log_success "MongoDB instalado y corriendo"
}

#===============================================================================
# 5. Instalar Nginx
#===============================================================================

install_nginx() {
    log_info "Instalando Nginx..."
    
    apt install -y nginx
    systemctl enable nginx
    
    log_success "Nginx instalado"
}

#===============================================================================
# 6. Crear estructura de directorios
#===============================================================================

setup_directories() {
    log_info "Creando estructura de directorios..."
    
    # Crear directorio principal si no existe
    mkdir -p ${APP_DIR}
    
    # Crear directorios de almacenamiento
    mkdir -p ${APP_DIR}/storage/{datasets,contracts,evidence/dataset_publications,exports}
    mkdir -p ${APP_DIR}/backend
    mkdir -p ${APP_DIR}/frontend
    mkdir -p ${APP_DIR}/docs
    mkdir -p /home/${APP_USER}/backups
    
    # Establecer permisos
    chown -R ${APP_USER}:${APP_USER} ${APP_DIR}
    chown -R ${APP_USER}:${APP_USER} /home/${APP_USER}/backups
    chmod -R 755 ${APP_DIR}/storage
    
    log_success "Directorios creados"
}

#===============================================================================
# 7. Copiar archivos del proyecto (si existe origen)
#===============================================================================

copy_project_files() {
    log_info "Verificando archivos del proyecto..."
    
    # Si el script se ejecuta desde /app, copiar archivos
    if [[ -d "/app/backend" ]] && [[ -d "/app/frontend" ]]; then
        log_info "Copiando archivos desde /app..."
        
        cp -r /app/backend/* ${APP_DIR}/backend/
        cp -r /app/frontend/* ${APP_DIR}/frontend/
        cp -r /app/storage/* ${APP_DIR}/storage/ 2>/dev/null || true
        cp -r /app/docs/* ${APP_DIR}/docs/ 2>/dev/null || true
        
        chown -R ${APP_USER}:${APP_USER} ${APP_DIR}
        
        log_success "Archivos copiados"
    else
        log_warn "No se encontraron archivos en /app. Deberás copiar el proyecto manualmente."
        log_warn "Usa: scp -r /ruta/proyecto admin@${SERVER_IP}:${APP_DIR}"
    fi
}

#===============================================================================
# 8. Configurar Backend
#===============================================================================

setup_backend() {
    log_info "Configurando Backend..."
    
    cd ${APP_DIR}/backend
    
    # Crear entorno virtual
    sudo -u ${APP_USER} python3 -m venv venv
    
    # Activar e instalar dependencias
    sudo -u ${APP_USER} bash -c "source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt && pip install gunicorn"
    
    # Crear archivo .env
    cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=${MONGO_DB}
JWT_SECRET=${JWT_SECRET}
CORS_ORIGINS=http://${SERVER_IP},http://${SERVER_IP}:3000,http://localhost:3000
EOF
    
    chown ${APP_USER}:${APP_USER} .env
    chmod 600 .env
    
    log_success "Backend configurado"
}

#===============================================================================
# 9. Configurar Frontend
#===============================================================================

setup_frontend() {
    log_info "Configurando Frontend..."
    
    cd ${APP_DIR}/frontend
    
    # Crear archivo .env
    cat > .env << EOF
REACT_APP_BACKEND_URL=http://${SERVER_IP}
EOF
    
    chown ${APP_USER}:${APP_USER} .env
    
    # Instalar dependencias y construir
    sudo -u ${APP_USER} yarn install
    sudo -u ${APP_USER} yarn build
    
    # Instalar serve globalmente
    npm install -g serve
    
    log_success "Frontend configurado y construido"
}

#===============================================================================
# 10. Crear servicios Systemd
#===============================================================================

create_systemd_services() {
    log_info "Creando servicios systemd..."
    
    # Servicio Backend
    cat > /etc/systemd/system/fenitel-backend.service << EOF
[Unit]
Description=FENITEL Espacio de Datos - Backend API
After=network.target mongod.service
Requires=mongod.service

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}/backend
Environment=PATH=${APP_DIR}/backend/venv/bin:/usr/bin
ExecStart=${APP_DIR}/backend/venv/bin/gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8001
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Servicio Frontend
    cat > /etc/systemd/system/fenitel-frontend.service << EOF
[Unit]
Description=FENITEL Espacio de Datos - Frontend
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}/frontend
ExecStart=/usr/bin/npx serve -s build -l 3000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Recargar systemd
    systemctl daemon-reload
    
    # Habilitar servicios
    systemctl enable fenitel-backend
    systemctl enable fenitel-frontend
    
    log_success "Servicios systemd creados"
}

#===============================================================================
# 11. Configurar Nginx
#===============================================================================

configure_nginx() {
    log_info "Configurando Nginx..."
    
    cat > /etc/nginx/sites-available/fenitel << EOF
server {
    listen 80;
    server_name ${SERVER_IP};

    # Logs
    access_log /var/log/nginx/fenitel_access.log;
    error_log /var/log/nginx/fenitel_error.log;

    # Frontend - Aplicación React
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001/api;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Para subida de archivos grandes (datasets)
        client_max_body_size 100M;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}
EOF

    # Habilitar sitio
    ln -sf /etc/nginx/sites-available/fenitel /etc/nginx/sites-enabled/
    
    # Deshabilitar sitio por defecto
    rm -f /etc/nginx/sites-enabled/default
    
    # Verificar configuración
    nginx -t
    
    log_success "Nginx configurado"
}

#===============================================================================
# 12. Crear usuario Promotor inicial
#===============================================================================

create_promotor() {
    log_info "Creando usuario Promotor inicial..."
    
    cd ${APP_DIR}/backend
    
    sudo -u ${APP_USER} bash -c "source venv/bin/activate && python3 << 'PYTHON_SCRIPT'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone

async def create_promotor():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['${MONGO_DB}']
    
    # Verificar si ya existe
    existing = await db.users.find_one({'email': '${PROMOTOR_EMAIL}'})
    if existing:
        print('Usuario promotor ya existe')
        client.close()
        return
    
    user = {
        'id': str(uuid.uuid4()),
        'email': '${PROMOTOR_EMAIL}',
        'name': 'FENITEL Administrador',
        'organization': 'FENITEL',
        'nif': 'G12345678',
        'phone': '+34 600 000 000',
        'address': 'Madrid, España',
        'password_hash': bcrypt.hashpw('${PROMOTOR_PASSWORD}'.encode(), bcrypt.gensalt()).decode(),
        'role': 'promotor',
        'incorporation_status': 'effective',
        'contract_signed': True,
        'payment_status': 'paid',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'is_provider': True,
        'identity_evidence_id': None,
        'contract_reference': None,
        'registration_certificate_url': None,
        'registration_certificate_hash': None
    }
    
    await db.users.insert_one(user)
    print('Usuario promotor creado exitosamente')
    client.close()

asyncio.run(create_promotor())
PYTHON_SCRIPT"
    
    log_success "Usuario Promotor creado"
}

#===============================================================================
# 13. Crear script de backup
#===============================================================================

create_backup_script() {
    log_info "Creando script de backup..."
    
    cat > /home/${APP_USER}/backup-fenitel.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/admin/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

echo "[$(date)] Iniciando backup..."

# Backup MongoDB
mongodump --db fenitel_data_space --out $BACKUP_DIR/mongo_$DATE
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup MongoDB completado"
else
    echo "[$(date)] ERROR en backup MongoDB"
fi

# Backup Storage
tar -czvf $BACKUP_DIR/storage_$DATE.tar.gz /home/admin/fenitel-espacio-datos/storage
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup Storage completado"
else
    echo "[$(date)] ERROR en backup Storage"
fi

# Limpiar backups antiguos (más de 30 días)
find $BACKUP_DIR -mtime +30 -delete

echo "[$(date)] Backup finalizado: $DATE"
EOF

    chmod +x /home/${APP_USER}/backup-fenitel.sh
    chown ${APP_USER}:${APP_USER} /home/${APP_USER}/backup-fenitel.sh
    
    # Agregar al crontab del usuario
    sudo -u ${APP_USER} bash -c '(crontab -l 2>/dev/null | grep -v backup-fenitel; echo "0 2 * * * /home/admin/backup-fenitel.sh >> /home/admin/backup.log 2>&1") | crontab -'
    
    log_success "Script de backup creado y programado (diario a las 2:00 AM)"
}

#===============================================================================
# 14. Configurar Firewall
#===============================================================================

configure_firewall() {
    log_info "Configurando firewall..."
    
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw --force enable
    
    log_success "Firewall configurado"
}

#===============================================================================
# 15. Iniciar servicios
#===============================================================================

start_services() {
    log_info "Iniciando servicios..."
    
    systemctl restart mongod
    sleep 2
    
    systemctl start fenitel-backend
    sleep 3
    
    systemctl start fenitel-frontend
    sleep 2
    
    systemctl restart nginx
    
    log_success "Servicios iniciados"
}

#===============================================================================
# 16. Verificar instalación
#===============================================================================

verify_installation() {
    log_info "Verificando instalación..."
    
    echo ""
    echo "=============================================="
    echo "        ESTADO DE LOS SERVICIOS"
    echo "=============================================="
    
    # MongoDB
    if systemctl is-active --quiet mongod; then
        echo -e "MongoDB:          ${GREEN}ACTIVO${NC}"
    else
        echo -e "MongoDB:          ${RED}INACTIVO${NC}"
    fi
    
    # Backend
    if systemctl is-active --quiet fenitel-backend; then
        echo -e "Backend:          ${GREEN}ACTIVO${NC}"
    else
        echo -e "Backend:          ${RED}INACTIVO${NC}"
    fi
    
    # Frontend
    if systemctl is-active --quiet fenitel-frontend; then
        echo -e "Frontend:         ${GREEN}ACTIVO${NC}"
    else
        echo -e "Frontend:         ${RED}INACTIVO${NC}"
    fi
    
    # Nginx
    if systemctl is-active --quiet nginx; then
        echo -e "Nginx:            ${GREEN}ACTIVO${NC}"
    else
        echo -e "Nginx:            ${RED}INACTIVO${NC}"
    fi
    
    echo ""
    
    # Test API
    log_info "Probando API..."
    sleep 2
    
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8001/api/ 2>/dev/null || echo "000")
    if [[ "$API_RESPONSE" == "200" ]] || [[ "$API_RESPONSE" == "404" ]]; then
        echo -e "API Backend:      ${GREEN}RESPONDIENDO${NC}"
    else
        echo -e "API Backend:      ${RED}NO RESPONDE (HTTP $API_RESPONSE)${NC}"
    fi
    
    echo ""
}

#===============================================================================
# 17. Mostrar resumen final
#===============================================================================

show_summary() {
    echo ""
    echo "=============================================="
    echo -e "${GREEN}   INSTALACION COMPLETADA EXITOSAMENTE${NC}"
    echo "=============================================="
    echo ""
    echo "URLS DE ACCESO:"
    echo "  - Aplicación:    http://${SERVER_IP}"
    echo "  - API Backend:   http://${SERVER_IP}/api"
    echo ""
    echo "CREDENCIALES PROMOTOR:"
    echo "  - Email:         ${PROMOTOR_EMAIL}"
    echo "  - Password:      ${PROMOTOR_PASSWORD}"
    echo ""
    echo "COMANDOS UTILES:"
    echo "  - Ver logs backend:    sudo journalctl -u fenitel-backend -f"
    echo "  - Ver logs frontend:   sudo journalctl -u fenitel-frontend -f"
    echo "  - Reiniciar backend:   sudo systemctl restart fenitel-backend"
    echo "  - Reiniciar frontend:  sudo systemctl restart fenitel-frontend"
    echo "  - Estado servicios:    sudo systemctl status fenitel-backend fenitel-frontend"
    echo "  - Backup manual:       /home/${APP_USER}/backup-fenitel.sh"
    echo ""
    echo "ARCHIVOS IMPORTANTES:"
    echo "  - Backend .env:   ${APP_DIR}/backend/.env"
    echo "  - Frontend .env:  ${APP_DIR}/frontend/.env"
    echo "  - Nginx config:   /etc/nginx/sites-available/fenitel"
    echo "  - Storage:        ${APP_DIR}/storage/"
    echo ""
    echo "=============================================="
}

#===============================================================================
# MAIN - Ejecución principal
#===============================================================================

main() {
    echo ""
    echo "=============================================="
    echo "  FENITEL Espacio de Datos - Instalador"
    echo "  Servidor: ${SERVER_IP}"
    echo "=============================================="
    echo ""
    
    check_root
    check_ubuntu
    
    log_info "Iniciando instalación completa..."
    echo ""
    
    update_system
    install_nodejs
    install_python
    install_mongodb
    install_nginx
    setup_directories
    copy_project_files
    setup_backend
    setup_frontend
    create_systemd_services
    configure_nginx
    create_promotor
    create_backup_script
    configure_firewall
    start_services
    verify_installation
    show_summary
}

# Ejecutar
main "$@"
