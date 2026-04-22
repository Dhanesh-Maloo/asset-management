import asyncio
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    # Connect to MongoDB
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client["test_database"]
    
    # Clear existing data
    await db.tenants.delete_many({})
    await db.users.delete_many({})
    await db.products.delete_many({})
    await db.orders.delete_many({})
    await db.assets.delete_many({})
    await db.tickets.delete_many({})
    await db.asset_history.delete_many({})
    
    print("Creating tenants...")
    tenants = [
        {
            "id": "tenant-1",
            "name": "Acme Corporation",
            "domain": "acme.com",
            "subdomain": "acme",
            "custom_domain": "",
            "logo_url": "",
            "primary_color": "#DC2626",
            "secondary_color": "#FEE2E2",
            "company_name": "Acme Corporation",
            "enabled_features": ["products", "orders", "assets", "tickets", "users", "groups", "workflows"],
            "settings": {},
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "tenant-2",
            "name": "TechStart Inc",
            "domain": "techstart.io",
            "subdomain": "techstart",
            "custom_domain": "",
            "logo_url": "",
            "primary_color": "#059669",
            "secondary_color": "#D1FAE5",
            "company_name": "TechStart Inc",
            "enabled_features": ["products", "orders", "assets", "tickets"],
            "settings": {},
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.tenants.insert_many(tenants)
    print(f"Created {len(tenants)} tenants")
    
    print("Creating users...")
    users = [
        {
            "id": "user-super-admin",
            "email": "admin@itassets.com",
            "password_hash": pwd_context.hash("admin123"),
            "name": "Super Administrator",
            "role": "super_admin",
            "tenant_id": None,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "user-tenant-admin-1",
            "email": "admin@acme.com",
            "password_hash": pwd_context.hash("acme123"),
            "name": "John Acme",
            "role": "tenant_admin",
            "tenant_id": "tenant-1",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "user-asset-manager-1",
            "email": "manager@acme.com",
            "password_hash": pwd_context.hash("acme123"),
            "name": "Sarah Manager",
            "role": "asset_manager",
            "tenant_id": "tenant-1",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "user-employee-1",
            "email": "employee@acme.com",
            "password_hash": pwd_context.hash("acme123"),
            "name": "Mike Employee",
            "role": "employee",
            "tenant_id": "tenant-1",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.users.insert_many(users)
    print(f"Created {len(users)} users")
    
    print("Creating products...")
    products = [
        {
            "id": "product-1",
            "name": "Dell Latitude 5420",
            "category": "Laptops",
            "description": "14-inch business laptop with Intel Core i5, 16GB RAM, 512GB SSD",
            "specs": {"processor": "Intel Core i5-11500", "ram": "16GB", "storage": "512GB SSD"},
            "image_url": "",
            "stock": 25,
            "price": 1299.99,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "product-2",
            "name": "MacBook Pro 14\"",
            "category": "Laptops",
            "description": "14-inch MacBook Pro with M3 chip, 16GB RAM, 512GB SSD",
            "specs": {"processor": "Apple M3", "ram": "16GB", "storage": "512GB SSD"},
            "image_url": "",
            "stock": 15,
            "price": 1999.99,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "product-3",
            "name": "Dell UltraSharp U2722DE",
            "category": "Monitors",
            "description": "27-inch QHD USB-C hub monitor with IPS panel",
            "specs": {"size": "27 inch", "resolution": "2560x1440", "type": "IPS"},
            "image_url": "",
            "stock": 40,
            "price": 499.99,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "product-4",
            "name": "Logitech MX Keys",
            "category": "Keyboards",
            "description": "Wireless illuminated keyboard for productivity",
            "specs": {"type": "Wireless", "connectivity": "Bluetooth/USB"},
            "image_url": "",
            "stock": 50,
            "price": 99.99,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "product-5",
            "name": "Logitech MX Master 3S",
            "category": "Mice",
            "description": "Wireless performance mouse with precision scrolling",
            "specs": {"type": "Wireless", "dpi": "8000", "buttons": "7"},
            "image_url": "",
            "stock": 45,
            "price": 99.99,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "product-6",
            "name": "HP LaserJet Pro M404dn",
            "category": "Printers",
            "description": "Monochrome laser printer with duplex printing",
            "specs": {"type": "Laser", "color": "Mono", "speed": "40 ppm"},
            "image_url": "",
            "stock": 10,
            "price": 299.99,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.products.insert_many(products)
    print(f"Created {len(products)} products")
    
    print("Creating orders...")
    orders = [
        {
            "id": "order-1",
            "tenant_id": "tenant-1",
            "user_id": "user-employee-1",
            "product_id": "product-1",
            "quantity": 1,
            "status": "pending",
            "approved_by": None,
            "approval_date": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "order-2",
            "tenant_id": "tenant-1",
            "user_id": "user-employee-1",
            "product_id": "product-3",
            "quantity": 2,
            "status": "approved",
            "approved_by": "user-tenant-admin-1",
            "approval_date": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.orders.insert_many(orders)
    print(f"Created {len(orders)} orders")
    
    print("Creating assets...")
    assets = [
        {
            "id": "asset-1",
            "asset_tag": "LAP-001",
            "product_id": "product-1",
            "serial_number": "DL5420-ABC123",
            "tenant_id": "tenant-1",
            "status": "assigned",
            "assigned_to": "user-employee-1",
            "assigned_date": datetime.now(timezone.utc).isoformat(),
            "location": "Office Floor 3",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "asset-2",
            "asset_tag": "LAP-002",
            "product_id": "product-2",
            "serial_number": "MBP14-XYZ789",
            "tenant_id": "tenant-1",
            "status": "available",
            "assigned_to": None,
            "assigned_date": None,
            "location": "IT Storage Room",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "asset-3",
            "asset_tag": "MON-001",
            "product_id": "product-3",
            "serial_number": "DU2722-111222",
            "tenant_id": "tenant-1",
            "status": "assigned",
            "assigned_to": "user-employee-1",
            "assigned_date": datetime.now(timezone.utc).isoformat(),
            "location": "Office Floor 3",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "asset-4",
            "asset_tag": "MON-002",
            "product_id": "product-3",
            "serial_number": "DU2722-333444",
            "tenant_id": "tenant-1",
            "status": "available",
            "assigned_to": None,
            "assigned_date": None,
            "location": "IT Storage Room",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.assets.insert_many(assets)
    print(f"Created {len(assets)} assets")
    
    print("Creating tickets...")
    tickets = [
        {
            "id": "ticket-1",
            "ticket_number": "TKT-00001",
            "tenant_id": "tenant-1",
            "created_by": "user-employee-1",
            "assigned_to": None,
            "title": "Laptop screen flickering",
            "description": "My laptop screen started flickering intermittently. Need assistance.",
            "priority": "high",
            "status": "open",
            "category": "hardware",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "ticket-2",
            "ticket_number": "TKT-00002",
            "tenant_id": "tenant-1",
            "created_by": "user-employee-1",
            "assigned_to": "user-asset-manager-1",
            "title": "Need additional monitor",
            "description": "Requesting an additional monitor for dual-screen setup.",
            "priority": "medium",
            "status": "in_progress",
            "category": "equipment_request",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.tickets.insert_many(tickets)
    print(f"Created {len(tickets)} tickets")
    
    print("\nDatabase seeded successfully!")
    print("\nTest Credentials:")
    print("Super Admin: admin@itassets.com / admin123")
    print("Tenant Admin: admin@acme.com / acme123")
    print("Asset Manager: manager@acme.com / acme123")
    print("Employee: employee@acme.com / acme123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
