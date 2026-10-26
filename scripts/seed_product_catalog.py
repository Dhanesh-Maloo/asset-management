"""Seed the warehouse/office product catalog for one tenant. Idempotent: skips names that already exist.

Usage (from backend/):  python ../scripts/seed_product_catalog.py <tenant_id> [--apply]
Without --apply it only prints what would be added. Prices are INR and stored the same way the app does.
"""
import asyncio, os, re, sys, uuid
from datetime import datetime, timezone
import httpx
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(".env")

CATALOG = {
    "Furniture": [
        ("Computer Wooden Table", "Wooden desk for computer workstations", {"Material": "Wood", "Type": "Workstation", "Size": "4x2 ft"}, 6000),
        ("Metal Table", "Steel-frame utility table for office or warehouse", {"Material": "Steel", "Type": "Utility", "Size": "4x2 ft"}, 5000),
        ("Rotating Chair", "Ergonomic swivel chair with wheels", {"Material": "Mesh/Fabric", "Type": "Swivel", "Adjustable height": "Yes"}, 4500),
        ("Plastic Chair", "Stackable plastic chair for visitors and canteen", {"Material": "Plastic", "Type": "Stackable"}, 800),
        ("Soft Board", "Pin-up notice board", {"Material": "Cork/Fabric", "Size": "3x2 ft"}, 1200),
        ("White Board", "Writing board for meetings and planning", {"Material": "Melamine", "Size": "4x3 ft", "Marker type": "Dry-erase"}, 1800),
    ],
    "Storage & Racking": [
        ("Heavy Duty Rack", "Industrial rack for heavy goods", {"Material": "Steel", "Load capacity": "500 kg/shelf", "Shelves": "4"}, 12000),
        ("Slotted Angle Rack", "Bolt-together slotted angle storage rack", {"Material": "MS angle", "Load capacity": "100 kg/shelf", "Shelves": "5"}, 4500),
        ("Wooden Pallet", "Wooden pallet for forklift and stacking", {"Material": "Wood", "Size": "1200x1000 mm", "Load capacity": "1000 kg"}, 700),
        ("Plastic Pallet", "Reusable plastic pallet", {"Material": "HDPE", "Size": "1200x1000 mm", "Load capacity": "1000 kg"}, 2200),
    ],
    "IT Equipment": [
        ("Computer Screen", "LED monitor for desktop systems", {"Size": "21.5 in", "Resolution": "1920x1080", "Ports": "HDMI/VGA"}, 8000),
        ("CPU", "Desktop computer cabinet", {}, 30000),
        ("Keyboard", "Wired USB keyboard", {"Type": "Wired", "Interface": "USB", "Layout": "Standard"}, 500),
        ("Mouse", "Wired USB optical mouse", {"Type": "Wired", "Interface": "USB"}, 300),
        ("Printer", "Office printer for print/scan/copy", {"Type": "Laser", "Functions": "Print/Scan/Copy", "Connectivity": "USB/Wi-Fi"}, 12000),
        ("Router", "Wi-Fi router for office or warehouse network", {"Standard": "Wi-Fi 5", "Ports": "4 LAN + 1 WAN", "Speed": "1200 Mbps"}, 2500),
        ("UPS", "Backup power for computers and network gear", {"Capacity": "1 kVA", "Backup time": "~15 min", "Type": "Line-interactive"}, 5000),
        ("Dongle", "USB Wi-Fi or data dongle", {"Type": "USB", "Network": "4G/Wi-Fi"}, 1500),
        ("Mobile", "Company-issued smartphone", {}, 15000),
    ],
    "Surveillance & Security": [
        ("CCTV Rack", "Wall-mount rack housing DVR/NVR and power supply", {"Type": "Wall-mount", "Size": "9U", "Lockable": "Yes"}, 6000),
        ("Camera", "CCTV surveillance camera", {"Type": "Dome/Bullet", "Resolution": "2 MP", "Night vision": "Yes"}, 2500),
    ],
    "Electrical & Appliances": [
        ("Fan", "Ceiling or wall fan", {"Type": "Ceiling", "Sweep": "1200 mm", "Power": "75 W"}, 2200),
        ("Light", "LED light for office or warehouse", {"Type": "LED panel/batten", "Power": "18 W", "Color": "Cool white"}, 600),
        ("Fridge", "Refrigerator for pantry or office", {"Capacity": "190 L", "Type": "Single door", "Power": "5-star"}, 15000),
        ("AC Indoor Unit", "Split AC indoor unit", {"Capacity": "1.5 ton", "Type": "Split", "Energy rating": "3-star"}, 22000),
        ("AC Outdoor Unit", "Split AC outdoor unit (pairs with the indoor unit)", {"Capacity": "1.5 ton", "Compressor": "Inverter", "Refrigerant": "R32"}, 20000),
        ("Remote", "Replacement or spare remote", {"Compatible with": "AC/Fan/TV", "Battery": "AAA x2"}, 400),
    ],
}

def category_key(name):
    """Same normalization as backend/server.py _category_key."""
    k = re.sub(r"[^a-z0-9]", "", (name or "").lower())
    if len(k) > 3:
        if k.endswith("ies"): k = k[:-3] + "y"
        elif k.endswith(("sses", "xes", "ches", "shes")): k = k[:-2]
        elif k.endswith("s") and not k.endswith("ss"): k = k[:-1]
    return k

async def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    tenant_id, apply = sys.argv[1], "--apply" in sys.argv
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        sys.exit("Tenant not found")
    currency = tenant.get("settings", {}).get("currency") or "USD"
    rate = 1.0
    if currency != "USD":
        try:
            async with httpx.AsyncClient() as c:
                rate = (await c.get("https://api.exchangerate-api.com/v4/latest/USD", timeout=5)).json()["rates"][currency]
        except Exception:
            rate = {"INR": 83.0}.get(currency, 1.0)
    print(f"Tenant: {tenant['name']} ({currency}, rate {rate}) | mode: {'APPLY' if apply else 'DRY RUN'}")

    existing = {p["name"].strip().lower() async for p in db.products.find(
        {"is_deleted": {"$ne": True}, "$or": [{"tenant_id": tenant_id}, {"tenant_id": None}]}, {"_id": 0, "name": 1})}
    added = skipped = 0
    for cat, items in CATALOG.items():
        key = category_key(cat)
        cat_doc = await db.product_categories.find_one({"key": key}, {"_id": 0})
        cat_name = cat_doc["name"] if cat_doc else cat
        if not cat_doc:
            print(f"+ category {cat}")
            if apply:
                await db.product_categories.insert_one({"id": str(uuid.uuid4()), "name": cat, "key": key,
                    "created_by": "seed-script", "created_by_tenant": tenant_id,
                    "created_at": datetime.now(timezone.utc).isoformat()})
        for name, desc, specs, price in items:
            if name.lower() in existing:
                print(f"  skip (exists)  {name}"); skipped += 1; continue
            doc = {"id": str(uuid.uuid4()), "name": name, "category": cat_name, "description": desc, "specs": specs,
                   "image_url": "", "stock": 0, "price": round(price / rate, 2), "tenant_id": tenant_id,
                   "created_at": datetime.now(timezone.utc).isoformat()}
            if currency != "USD":
                doc["price_original"], doc["price_currency"] = float(price), currency
            print(f"  add  [{cat_name}] {name}  {currency} {price}")
            if apply:
                await db.products.insert_one(doc)
            added += 1
    print(f"\n{'Added' if apply else 'Would add'}: {added} | skipped: {skipped}")

asyncio.run(main())
