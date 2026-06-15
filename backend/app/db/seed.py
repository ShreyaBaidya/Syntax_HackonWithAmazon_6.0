"""
Seed data: 50 mock products across 10 categories.
Used both as DynamoDB seed and as in-memory fallback for local dev.
"""
import boto3
# from __MACOSX.urgentShopping.urgentShopping.backend.app.core.config import settings
from app.core.config import settings
PRODUCTS: list[dict] = [
    # ── Medicine ──────────────────────────────────────────────────────────────
    {"id": "p001", "name": "Paracetamol 500mg (10 tabs)", "category": "medicine",
     "price": 45.0, "unit": "strip", "eta_min": 28, "in_stock": True,
     "image_url": "https://placehold.co/200x200/EEF2FF/4F46E5?text=Paracetamol",
     "tags": "fever headache pain relief tablet"},
    {"id": "p002", "name": "Ibuprofen 400mg (15 tabs)", "category": "medicine",
     "price": 72.0, "unit": "strip", "eta_min": 28, "in_stock": True,
     "image_url": "https://placehold.co/200x200/EEF2FF/4F46E5?text=Ibuprofen",
     "tags": "pain inflammation fever ibuprofen"},
    {"id": "p003", "name": "ORS Sachets (5 pack)", "category": "medicine",
     "price": 55.0, "unit": "pack", "eta_min": 28, "in_stock": True,
     "image_url": "https://placehold.co/200x200/EEF2FF/4F46E5?text=ORS",
     "tags": "dehydration electrolytes diarrhea rehydration"},
    {"id": "p004", "name": "Digital Thermometer", "category": "medicine",
     "price": 199.0, "unit": "piece", "eta_min": 35, "in_stock": True,
     "image_url": "https://placehold.co/200x200/EEF2FF/4F46E5?text=Thermometer",
     "tags": "fever temperature thermometer"},
    {"id": "p005", "name": "Cold & Flu Relief Tablets (10 tabs)", "category": "medicine",
     "price": 89.0, "unit": "strip", "eta_min": 28, "in_stock": True,
     "image_url": "https://placehold.co/200x200/EEF2FF/4F46E5?text=Cold+Flu",
     "tags": "cold flu cough runny nose sore throat"},

    # ── Beverages ─────────────────────────────────────────────────────────────
    {"id": "p006", "name": "Nescafé Classic Instant Coffee 200g", "category": "beverages",
     "price": 189.0, "unit": "jar", "eta_min": 22, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFF7ED/EA580C?text=Nescafe",
     "tags": "coffee morning caffeine instant nescafe"},
    {"id": "p007", "name": "Pepsi 2L Bottle", "category": "beverages",
     "price": 99.0, "unit": "bottle", "eta_min": 22, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFF7ED/EA580C?text=Pepsi",
     "tags": "soft drink soda party cold pepsi drinks"},
    {"id": "p008", "name": "Minute Maid Orange Juice 1L", "category": "beverages",
     "price": 120.0, "unit": "pack", "eta_min": 22, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFF7ED/EA580C?text=OJ",
     "tags": "juice orange vitamin c healthy morning"},
    {"id": "p009", "name": "Red Bull Energy Drink 250ml", "category": "beverages",
     "price": 115.0, "unit": "can", "eta_min": 22, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFF7ED/EA580C?text=RedBull",
     "tags": "energy caffeine late night work focus"},
    {"id": "p010", "name": "Lipton Green Tea (25 bags)", "category": "beverages",
     "price": 85.0, "unit": "box", "eta_min": 22, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFF7ED/EA580C?text=GreenTea",
     "tags": "tea healthy antioxidant calm relaxing"},

    # ── Dairy ─────────────────────────────────────────────────────────────────
    {"id": "p011", "name": "Amul Full Cream Milk 1L", "category": "dairy",
     "price": 66.0, "unit": "packet", "eta_min": 18, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F0FDF4/16A34A?text=Milk",
     "tags": "milk dairy morning breakfast amul"},
    {"id": "p012", "name": "Britannia Bread 400g", "category": "dairy",
     "price": 45.0, "unit": "pack", "eta_min": 18, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F0FDF4/16A34A?text=Bread",
     "tags": "bread breakfast toast sandwich"},
    {"id": "p013", "name": "Amul Butter 100g", "category": "dairy",
     "price": 58.0, "unit": "pack", "eta_min": 18, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F0FDF4/16A34A?text=Butter",
     "tags": "butter toast cooking baking"},
    {"id": "p014", "name": "Epigamia Greek Yogurt 90g", "category": "dairy",
     "price": 55.0, "unit": "cup", "eta_min": 18, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F0FDF4/16A34A?text=Yogurt",
     "tags": "yogurt healthy protein morning probiotic"},
    {"id": "p015", "name": "Amul Processed Cheese Slices (10 slices)", "category": "dairy",
     "price": 89.0, "unit": "pack", "eta_min": 18, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F0FDF4/16A34A?text=Cheese",
     "tags": "cheese sandwich toast burger"},

    # ── Snacks ────────────────────────────────────────────────────────────────
    {"id": "p016", "name": "Lay's Classic Salted Chips 50g", "category": "snacks",
     "price": 20.0, "unit": "pack", "eta_min": 20, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FEFCE8/CA8A04?text=Lays",
     "tags": "chips snacks party crisps lays"},
    {"id": "p017", "name": "Oreo Original Cookies 120g", "category": "snacks",
     "price": 40.0, "unit": "pack", "eta_min": 20, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FEFCE8/CA8A04?text=Oreo",
     "tags": "cookies biscuits snacks party oreo"},
    {"id": "p018", "name": "Kurkure Masala Munch 90g", "category": "snacks",
     "price": 20.0, "unit": "pack", "eta_min": 20, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FEFCE8/CA8A04?text=Kurkure",
     "tags": "snacks masala crunchy party kurkure"},
    {"id": "p019", "name": "Maggi 2-Minute Noodles (4 pack)", "category": "snacks",
     "price": 68.0, "unit": "pack", "eta_min": 20, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FEFCE8/CA8A04?text=Maggi",
     "tags": "noodles quick meal hunger maggi comfort"},
    {"id": "p020", "name": "Parle-G Glucose Biscuits 800g", "category": "snacks",
     "price": 60.0, "unit": "pack", "eta_min": 20, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FEFCE8/CA8A04?text=ParleG",
     "tags": "biscuits tea snack parle glucose"},

    # ── Personal Care ─────────────────────────────────────────────────────────
    {"id": "p021", "name": "Dettol Antiseptic Liquid 250ml", "category": "personal_care",
     "price": 139.0, "unit": "bottle", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FDF4FF/9333EA?text=Dettol",
     "tags": "antiseptic wound cut cleaning hygiene dettol"},
    {"id": "p022", "name": "Band-Aid Bandages (20 strips)", "category": "personal_care",
     "price": 75.0, "unit": "box", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FDF4FF/9333EA?text=BandAid",
     "tags": "bandage wound cut first aid plaster"},
    {"id": "p023", "name": "Vicks VapoRub 25g", "category": "personal_care",
     "price": 89.0, "unit": "jar", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FDF4FF/9333EA?text=Vicks",
     "tags": "cold congestion breathing cough blocked nose vicks"},
    {"id": "p024", "name": "Colgate Strong Teeth Toothpaste 200g", "category": "personal_care",
     "price": 89.0, "unit": "tube", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FDF4FF/9333EA?text=Colgate",
     "tags": "toothpaste dental hygiene morning colgate"},
    {"id": "p025", "name": "Dove Soap Bar 75g (Pack of 3)", "category": "personal_care",
     "price": 120.0, "unit": "pack", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FDF4FF/9333EA?text=Dove",
     "tags": "soap bath hygiene shower dove"},

    # ── Cleaning ──────────────────────────────────────────────────────────────
    {"id": "p026", "name": "Colin Glass Cleaner 500ml", "category": "cleaning",
     "price": 119.0, "unit": "bottle", "eta_min": 30, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F0F9FF/0284C7?text=Colin",
     "tags": "glass cleaner cleaning spray colin"},
    {"id": "p027", "name": "Harpic Power Plus Toilet Cleaner 500ml", "category": "cleaning",
     "price": 99.0, "unit": "bottle", "eta_min": 30, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F0F9FF/0284C7?text=Harpic",
     "tags": "toilet cleaner bathroom cleaning harpic"},
    {"id": "p028", "name": "Lizol Disinfectant Floor Cleaner 500ml", "category": "cleaning",
     "price": 129.0, "unit": "bottle", "eta_min": 30, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F0F9FF/0284C7?text=Lizol",
     "tags": "floor cleaner disinfectant cleaning lizol"},
    {"id": "p029", "name": "Scotch-Brite Scrub Pad (3 pack)", "category": "cleaning",
     "price": 45.0, "unit": "pack", "eta_min": 30, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F0F9FF/0284C7?text=Scrub",
     "tags": "scrub pad kitchen cleaning dishes utensils"},
    {"id": "p030", "name": "Surf Excel Matic Detergent 1kg", "category": "cleaning",
     "price": 279.0, "unit": "pack", "eta_min": 30, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F0F9FF/0284C7?text=SurfExcel",
     "tags": "laundry detergent washing clothes surf excel"},

    # ── Baby Care ─────────────────────────────────────────────────────────────
    {"id": "p031", "name": "Pampers Baby Dry Diapers M (30 count)", "category": "baby",
     "price": 549.0, "unit": "pack", "eta_min": 30, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFF1F2/E11D48?text=Pampers",
     "tags": "diapers baby nappy pampers"},
    {"id": "p032", "name": "Johnson's Baby Powder 200g", "category": "baby",
     "price": 175.0, "unit": "bottle", "eta_min": 30, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFF1F2/E11D48?text=BabyPowder",
     "tags": "baby powder skin care johnson"},
    {"id": "p033", "name": "Mamy Poko Pants XL (40 count)", "category": "baby",
     "price": 659.0, "unit": "pack", "eta_min": 30, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFF1F2/E11D48?text=MamyPoko",
     "tags": "diapers pants baby toddler mamy poko"},

    # ── Home & Emergency ──────────────────────────────────────────────────────
    {"id": "p034", "name": "Eveready AA Batteries (4 pack)", "category": "home",
     "price": 79.0, "unit": "pack", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F7F7F7/374151?text=Batteries",
     "tags": "batteries power outage emergency torch aa"},
    {"id": "p035", "name": "Havells LED Torch Flashlight", "category": "home",
     "price": 299.0, "unit": "piece", "eta_min": 35, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F7F7F7/374151?text=Torch",
     "tags": "torch flashlight power outage emergency light"},
    {"id": "p036", "name": "Wax Candles Pack (12 pcs)", "category": "home",
     "price": 59.0, "unit": "pack", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F7F7F7/374151?text=Candles",
     "tags": "candles power outage light emergency"},
    {"id": "p037", "name": "Disposable Paper Plates (50 pcs)", "category": "home",
     "price": 99.0, "unit": "pack", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F7F7F7/374151?text=Plates",
     "tags": "plates party disposable guests"},
    {"id": "p038", "name": "Disposable Plastic Cups (50 pcs)", "category": "home",
     "price": 75.0, "unit": "pack", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F7F7F7/374151?text=Cups",
     "tags": "cups party disposable drinks guests"},

    # ── Electronics ───────────────────────────────────────────────────────────
    {"id": "p039", "name": "Ambrane 10000mAh Power Bank", "category": "electronics",
     "price": 799.0, "unit": "piece", "eta_min": 40, "in_stock": True,
     "image_url": "https://placehold.co/200x200/ECFDF5/059669?text=PowerBank",
     "tags": "power bank charging mobile emergency battery"},
    {"id": "p040", "name": "USB Type-C Charging Cable 1m", "category": "electronics",
     "price": 199.0, "unit": "piece", "eta_min": 35, "in_stock": True,
     "image_url": "https://placehold.co/200x200/ECFDF5/059669?text=Cable",
     "tags": "charger cable usb type-c mobile android"},
    {"id": "p041", "name": "Universal Mobile Screen Guard", "category": "electronics",
     "price": 149.0, "unit": "piece", "eta_min": 35, "in_stock": True,
     "image_url": "https://placehold.co/200x200/ECFDF5/059669?text=ScreenGuard",
     "tags": "screen protector mobile phone tempered glass"},

    # ── Grocery Staples ───────────────────────────────────────────────────────
    {"id": "p051", "name": "Barilla Penne Pasta 500g", "category": "grocery",
     "price": 150.0, "unit": "pack", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFFBEB/D97706?text=Pasta",
     "tags": "pasta italian cooking penne macaroni"},
    {"id": "p042", "name": "Aashirvaad Whole Wheat Atta 5kg", "category": "grocery",
     "price": 279.0, "unit": "bag", "eta_min": 30, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFFBEB/D97706?text=Atta",
     "tags": "wheat flour cooking roti chapati atta"},
    {"id": "p043", "name": "Fortune Sunflower Oil 1L", "category": "grocery",
     "price": 149.0, "unit": "bottle", "eta_min": 28, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFFBEB/D97706?text=Oil",
     "tags": "cooking oil sunflower fortune"},
    {"id": "p044", "name": "Tata Salt 1kg", "category": "grocery",
     "price": 24.0, "unit": "pack", "eta_min": 22, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFFBEB/D97706?text=Salt",
     "tags": "salt cooking basic essential tata"},
    {"id": "p045", "name": "MDH Garam Masala 50g", "category": "grocery",
     "price": 55.0, "unit": "pack", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFFBEB/D97706?text=Masala",
     "tags": "spice masala cooking garam mdh"},
    {"id": "p046", "name": "Knorr Chicken Soup Mix 44g", "category": "grocery",
     "price": 45.0, "unit": "pack", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFFBEB/D97706?text=Soup",
     "tags": "soup chicken sick comfort food knorr warm"},

    # ── Fresh Produce ─────────────────────────────────────────────────────────
    {"id": "p047", "name": "Bananas 6 pcs (~500g)", "category": "fresh",
     "price": 49.0, "unit": "bunch", "eta_min": 35, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FEFCE8/A16207?text=Bananas",
     "tags": "fruit banana healthy morning breakfast energy"},
    {"id": "p048", "name": "Tomatoes 500g", "category": "fresh",
     "price": 30.0, "unit": "pack", "eta_min": 35, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFF1F2/BE123C?text=Tomatoes",
     "tags": "vegetable tomato cooking fresh salad"},
    {"id": "p049", "name": "Onions 1kg", "category": "fresh",
     "price": 45.0, "unit": "bag", "eta_min": 35, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFFBEB/B45309?text=Onions",
     "tags": "vegetable onion cooking basic essential"},
    {"id": "p050", "name": "Lemons 6 pcs", "category": "fresh",
     "price": 20.0, "unit": "pack", "eta_min": 35, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FEFCE8/A16207?text=Lemons",
     "tags": "lemon citrus vitamin c fresh juice nimbu"},

    # ── Party & Gatherings ────────────────────────────────────────────────────
    {"id": "p052", "name": "Party Popper (2 pcs)", "category": "party",
     "price": 120.0, "unit": "pack", "eta_min": 30, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FEF08A/854D0E?text=PartyPopper",
     "tags": "party celebration birthday popper fun"},
    {"id": "p053", "name": "Balloons Pack (50 pcs)", "category": "party",
     "price": 99.0, "unit": "pack", "eta_min": 30, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FEF08A/854D0E?text=Balloons",
     "tags": "party decoration birthday balloons fun"},
    {"id": "p054", "name": "Diet Coke Can 330ml (6 pack)", "category": "beverages",
     "price": 240.0, "unit": "pack", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFF7ED/EA580C?text=DietCoke",
     "tags": "soft drink diet coke soda party drinks low calorie"},

    # ── Pet Care ──────────────────────────────────────────────────────────────
    {"id": "p055", "name": "Pedigree Adult Dog Food 1.2kg", "category": "pet",
     "price": 320.0, "unit": "bag", "eta_min": 35, "in_stock": True,
     "image_url": "https://placehold.co/200x200/E0E7FF/4338CA?text=DogFood",
     "tags": "dog food pet care pedigree meat"},
    {"id": "p056", "name": "Whiskas Adult Cat Food 1.2kg", "category": "pet",
     "price": 350.0, "unit": "bag", "eta_min": 35, "in_stock": True,
     "image_url": "https://placehold.co/200x200/E0E7FF/4338CA?text=CatFood",
     "tags": "cat food pet care whiskas fish"},

    # ── Quick Ready To Eat ────────────────────────────────────────────────────
    {"id": "p057", "name": "MTR Ready to Eat Paneer Butter Masala 300g", "category": "grocery",
     "price": 145.0, "unit": "pack", "eta_min": 25, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FFFBEB/D97706?text=Paneer",
     "tags": "paneer butter masala ready to eat quick food dinner mtr"},
    {"id": "p058", "name": "Haldiram's Aloo Bhujia 400g", "category": "snacks",
     "price": 110.0, "unit": "pack", "eta_min": 20, "in_stock": True,
     "image_url": "https://placehold.co/200x200/FEFCE8/CA8A04?text=Bhujia",
     "tags": "namkeen snacks party spicy bhujia haldiram"},
    {"id": "p059", "name": "Amul Ice Cream Tub - Vanilla 1L", "category": "dairy",
     "price": 220.0, "unit": "tub", "eta_min": 15, "in_stock": True,
     "image_url": "https://placehold.co/200x200/F0FDF4/16A34A?text=IceCream",
     "tags": "ice cream dessert vanilla sweet cold party amul"},
]

# Maps time-of-day context → preferred categories for recommendations
TIME_BASED_CATEGORIES: dict[str, list[str]] = {
    "morning":   ["dairy", "beverages", "fresh"],
    "midday":    ["grocery", "snacks", "fresh"],
    "afternoon": ["beverages", "snacks", "grocery"],
    "evening":   ["snacks", "beverages", "cleaning"],
    "night":     ["medicine", "snacks", "personal_care"],
}


def seed_products() -> None:
    """Write all mock products to DynamoDB."""
    dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
    table = dynamodb.Table(settings.dynamodb_products_table)

    from decimal import Decimal
    print(f"Seeding {len(PRODUCTS)} products → {settings.dynamodb_products_table} ...")
    with table.batch_writer() as batch:
        for product in PRODUCTS:
            item = dict(product)
            if 'price' in item:
                item['price'] = Decimal(str(item['price']))
            batch.put_item(Item=item)
    print("✅ Seed complete.")


if __name__ == "__main__":
    seed_products()
