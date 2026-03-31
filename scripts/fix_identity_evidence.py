#!/usr/bin/env python3
"""
Script para vincular evidencias de identidad existentes con los usuarios.
Ejecutar en el servidor de producción.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def fix_identity_evidence():
    # Conectar a MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'fenitel_datos')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Conectando a {mongo_url}, base de datos: {db_name}")
    
    # Obtener todos los usuarios sin identity_evidence_id
    users_without_evidence = await db.users.find({
        "$or": [
            {"identity_evidence_id": None},
            {"identity_evidence_id": {"$exists": False}}
        ]
    }).to_list(100)
    
    print(f"\nUsuarios sin identity_evidence_id vinculado: {len(users_without_evidence)}")
    
    for user in users_without_evidence:
        user_id = user.get("id")
        email = user.get("email")
        print(f"\nProcesando: {email} (ID: {user_id})")
        
        # Buscar evidencia de tipo membership_registration o identity para este usuario
        evidence = await db.evidence.find_one({
            "user_id": user_id,
            "evidence_type": {"$in": ["membership_registration", "identity"]}
        })
        
        if evidence:
            evidence_id = evidence.get("id")
            print(f"  ✅ Encontrada evidencia: {evidence_id}")
            
            # Actualizar el usuario con el identity_evidence_id
            result = await db.users.update_one(
                {"id": user_id},
                {"$set": {
                    "identity_evidence_id": evidence_id,
                    "incorporation_status": "active"
                }}
            )
            
            if result.modified_count > 0:
                print(f"  ✅ Usuario actualizado correctamente")
            else:
                print(f"  ⚠️ No se modificó el usuario")
        else:
            print(f"  ❌ No se encontró evidencia para este usuario")
            
            # Verificar si tiene contrato firmado y pago confirmado
            if user.get("contract_signed") and user.get("payment_status") == "paid":
                print(f"  ℹ️ El usuario tiene contrato firmado y pago confirmado")
                print(f"  ℹ️ Necesita generar evidencia de identidad manualmente")
    
    # Mostrar resumen
    print("\n" + "="*50)
    print("RESUMEN")
    print("="*50)
    
    total_users = await db.users.count_documents({})
    users_with_evidence = await db.users.count_documents({
        "identity_evidence_id": {"$ne": None, "$exists": True}
    })
    
    print(f"Total usuarios: {total_users}")
    print(f"Usuarios con evidencia vinculada: {users_with_evidence}")
    print(f"Usuarios pendientes: {total_users - users_with_evidence}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_identity_evidence())
