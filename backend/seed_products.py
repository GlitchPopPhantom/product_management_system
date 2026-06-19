import os
import django
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Product, Category

def seed_data():
    # Fetch or create a default user to own the items
    user, _ = User.get_or_create(username='demo_user')
    if _:
        user.set_password('password123')
        user.save()

    # Ensure categories exist before assignment
    categories = [
        'Electronics', 'Clothing', 'Groceries', 'Home Appliances', 
        'Books', 'Health & Beauty', 'Automotive', 'Toys & Games', 
        'Sports & Outdoors', 'Office Supplies', 'Furniture', 'Other'
    ]
    
    category_objects = {}
    for cat_name in categories:
        cat_obj, _ = Category.objects.get_or_create(name=cat_name)
        category_objects[cat_name] = cat_obj

    # 20 Realistic items structured exactly for your table columns
    mock_items = [
        ("Wireless Mechanical Keyboard", "RGB backlit mechanical keyboard with blue switches.", 45000.00, "Electronics", 15, "https://picsum.photos/id/0/300/200"),
        ("Ergonomic Office Chair", "High-back mesh chair with lumbar support and adjustable armrests.", 85000.00, "Furniture", 8, "https://picsum.photos/id/1/300/200"),
        ("Stainless Steel Water Bottle", "Double-wall vacuum insulated bottle, keeps drinks cold for 24 hours.", 12000.00, "Sports & Outdoors", 50, "https://picsum.photos/id/2/300/200"),
        ("Noise-Canceling Headphones", "Over-ear Bluetooth headphones with active noise cancellation.", 95000.00, "Electronics", 12, "https://picsum.photos/id/3/300/200"),
        ("Minimalist Leather Wallet", "Slim RFID-blocking wallet made from genuine top-grain leather.", 15000.00, "Clothing", 30, "https://picsum.photos/id/4/300/200"),
        ("Smart Fitness Watch", "Tracks heart rate, sleep steps, and features built-in GPS.", 38000.00, "Electronics", 22, "https://picsum.photos/id/5/300/200"),
        ("Ceramic Coffee Mug Set", "Set of 4 matte finish artisanal ceramic mugs.", 18500.00, "Home Appliances", 14, "https://picsum.photos/id/6/300/200"),
        ("Organic Green Tea", "Premium loose-leaf green tea sourced from organic estates.", 4500.00, "Groceries", 100, "https://picsum.photos/id/7/300/200"),
        ("Portable Power Bank", "20000mAh external battery pack with fast charging capabilities.", 22000.00, "Electronics", 40, "https://picsum.photos/id/8/300/200"),
        ("Dimmable Desk Lamp", "LED desk lamp with 5 color modes and a built-in USB charging port.", 16500.00, "Office Supplies", 18, "https://picsum.photos/id/9/300/200"),
        ("Running Running Shoes", "Lightweight, breathable athletic footwear for daily training.", 32000.00, "Clothing", 25, "https://picsum.photos/id/10/300/200"),
        ("Professional Chef's Knife", "8-inch high-carbon stainless steel forged kitchen knife.", 28000.00, "Home Appliances", 10, "https://picsum.photos/id/11/300/200"),
        ("Wireless Gaming Mouse", "Ultra-lightweight gaming mouse with high-precision optical sensor.", 24000.00, "Electronics", 35, "https://picsum.photos/id/12/300/200"),
        ("Hardcover Sci-Fi Novel", "An epic space opera journey through uncharted solar systems.", 6500.00, "Books", 60, "https://picsum.photos/id/13/300/200"),
        ("Moisturizing Face Cream", "Hydrating daily facial lotion infused with hyaluronic acid.", 14000.00, "Health & Beauty", 45, "https://picsum.photos/id/14/300/200"),
        ("Compact Car Dashcam", "1080p full HD dashboard camera with night vision and G-sensor.", 35000.00, "Automotive", 11, "https://picsum.photos/id/15/300/200"),
        ("Yoga Mat & Strap Set", "Non-slip eco-friendly exercise mat with carrying strap.", 15500.00, "Sports & Outdoors", 20, "https://picsum.photos/id/16/300/200"),
        ("Bluetooth Pocket Speaker", "Waterproof mini speaker with surprisingly deep bass.", 19000.00, "Electronics", 28, "https://picsum.photos/id/17/300/200"),
        ("Classic Aviator Sunglasses", "Polarized lenses with durable metal frames.", 13500.00, "Clothing", 55, "https://picsum.photos/id/18/300/200"),
        ("Desktop Organizer Tray", "Wooden multi-compartment workspace layout organizer.", 11000.00, "Office Supplies", 16, "https://picsum.photos/id/19/300/200")
    ]

    for name, desc, price, cat_name, stock, img_url in mock_items:
        # Assuming your model fields match these names
        Product.objects.get_or_create(
            user=user,
            name=name,
            description=desc,
            price=price,
            category=category_objects[cat_name],
            stock_quantity=stock, # Adjusted based on your column request
            image_url=img_url      # Adjusted based on your column request
        )
    print("Successfully seeded 20 products.")

if __name__ == '__main__':
    seed_data()
