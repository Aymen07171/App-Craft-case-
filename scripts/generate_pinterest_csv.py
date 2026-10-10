import csv
import json
import os
from datetime import datetime, timedelta
import requests

# Read .env
env = {}
with open('.env', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

token = env['PRINTIFY_API_TOKEN']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
shop_id = 29067558

# 1. Restore all 34 enabled variants & print_areas on 6aca3ec764139bf30d00f20f (Ancient Root Colossus)
r_bear = requests.get(f'https://api.printify.com/v1/shops/{shop_id}/products/6aca3ed4804a2b3c390a05ed.json', headers=headers).json()
v_ids = [v['id'] for v in r_bear['variants'] if v.get('is_enabled')]
enabled_v = [{'id': vid, 'price': 2220, 'is_enabled': True} for vid in v_ids]

pid_fix = '6aca3ec764139bf30d00f20f'
r_fix = requests.get(f'https://api.printify.com/v1/shops/{shop_id}/products/{pid_fix}.json', headers=headers).json()
pa = r_fix['print_areas'][0]
pa['variant_ids'] = v_ids
put_r = requests.put(
    f'https://api.printify.com/v1/shops/{shop_id}/products/{pid_fix}.json',
    headers=headers,
    json={
        'title': r_fix['title'],
        'description': r_fix['description'],
        'tags': r_fix['tags'],
        'variants': enabled_v,
        'print_areas': [pa],
    }
).json()
print(f"Restored {pid_fix}: {len([v for v in put_r.get('variants', []) if v.get('is_enabled')])} enabled variants, {len(put_r.get('images', []))} images")

# 2. Define the 5 master products in Printify and the 6 exact mockup views requested by the user
SELECTED_6_MOCKUPS = [
    {
        'key': 'front-iphone-18-pro-max',
        'label': 'Front view, iPhone 18 Pro Max',
        'variant_id': 423468,
        'camera_id': 152213,
        'camera_label': 'front',
    },
    {
        'key': 'closeup-iphone-16-pro-max',
        'label': 'Close-up view, iPhone 16 Pro Max',
        'variant_id': 112813,
        'camera_id': 106399,
        'camera_label': 'close-up',
    },
    {
        'key': 'standard-iphone-16-pro-max',
        'label': 'Standard view, iPhone 16 Pro Max',
        'variant_id': 112813,
        'camera_id': 106403,
        'camera_label': 'layers',
    },
    {
        'key': 'context-1-iphone-11',
        'label': 'Context view 1, iPhone 11',
        'variant_id': 62582,
        'camera_id': 97553,
        'camera_label': 'context-1',
    },
    {
        'key': 'samsung-galaxy-s24',
        'label': 'Samsung Galaxy S24',
        'variant_id': 105527,
        'camera_id': 102321,
        'camera_label': 'close-up-2',
    },
    {
        'key': 'front-samsung-galaxy-s26',
        'label': 'Front view, Samsung Galaxy S26',
        'variant_id': 254190,
        'camera_id': 128128,
        'camera_label': 'front',
    },
]

PRODUCTS = [
    {
        'sku': 'CASE-FOREST-001',
        'printify_id': '6aca3ea25a8ad36f790b398d',
        'slug': 'forest-guardians-mystical-creatures-tough-phone-case.jpg',
        'theme': 'Forest guardians & mystical creatures',
        'title': 'Forest Guardians & Mystical Creatures Tough Phone Case | Enchanted Woodland',
        'short_title': 'Forest Guardians & Mystical Creatures Tough Phone Case',
        'description': (
            'Step into the ancient emerald woods with our Forest Guardians & Mystical Creatures Tough Phone Case. '
            'Featuring an ethereal antlers-crowned forest spirit surrounded by glowing bioluminescent flora, '
            'dual-layer impact-resistant polycarbonate + TPU armor, raised camera & screen bezels, and MagSafe compatibility. '
            'Fits iPhone 18/17/16/15/14/13/12/11 & Samsung Galaxy S26/S25/S24/S23.'
        ),
        'keywords': 'forest guardian case, mystical creature phone case, enchanted forest iphone case, cottagecore phone case, fantasy woodland art, tough phone case, spirit of the forest, bioluminescent art case, nature lover gift, aesthetic iphone 16 case, samsung s24 tough case, magical creatures, magsafe tough case',
        'artwork_file': '/designs/CASE-FOREST-001_9x16_Artwork.png',
    },
    {
        'sku': 'CASE-SACRED-001',
        'printify_id': '6aca3ead8ae24d74970dd1de',
        'slug': 'sacred-stag-of-the-wildwood-tough-phone-case.jpg',
        'theme': 'Sacred Stag of the Wildwood',
        'title': 'Sacred Stag of the Wildwood Tough Phone Case | Celestial Golden Antlers Art',
        'short_title': 'Sacred Stag of the Wildwood Tough Phone Case',
        'description': (
            'Channel the majesty of the ancient forest with the Sacred Stag of the Wildwood Tough Phone Case. '
            'Showcasing a regal celestial white stag with luminous golden runes and starlight antlers, '
            'engineered with dual-layer shockproof TPU + polycarbonate protection, raised screen/lens edges, and full wireless charging support. '
            'Available for 34 iPhone & Samsung Galaxy models.'
        ),
        'keywords': 'sacred stag phone case, celestial deer iphone case, wildwood stag art, patronus style phone case, golden antlers case, mystical deer gift, fantasy nature phone case, tough protective case, witchy forest aesthetic, iphone 16 pro max case, samsung s25 ultra case, woodland creature gift, spiritual animal art',
        'artwork_file': '/designs/CASE-SACRED-001_9x16_Artwork.png',
    },
    {
        'sku': 'CASE-NINETA-001',
        'printify_id': '6aca3ebad7538ac1330eb064',
        'slug': 'nine-tailed-fox-of-the-untamed-forest-tough-phone-case.jpg',
        'theme': 'Nine-Tailed Fox of the Untamed Forest',
        'title': 'Nine-Tailed Fox of the Untamed Forest Tough Phone Case | Mythical Kitsune',
        'short_title': 'Nine-Tailed Fox of the Untamed Forest Tough Phone Case',
        'description': (
            'Unleash mythical elegance with our Nine-Tailed Fox of the Untamed Forest Tough Phone Case. '
            'Featuring a fierce celestial Kitsune wreathed in ethereal blue foxfire amidst a twilight bamboo sanctuary, '
            'built with dual-layer impact protection (polycarbonate outer shell + shock-absorbing TPU liner) and 300 DPI glossy wrap print. '
            'Fits 34 iPhone & Galaxy models.'
        ),
        'keywords': 'nine tailed fox case, kitsune phone case, mythical fox iphone case, japanese mythology art, foxfire aesthetic case, anime fantasy phone case, untamed forest fox, tough dual layer case, spirit fox gift, iphone 16 pro case, samsung galaxy s24 case, glowing kitsune art, magical beast phone case',
        'artwork_file': '/designs/CASE-NINETA-001_9x16_Artwork.png',
    },
    {
        'sku': 'CASE-ROOTCO-001',
        'printify_id': '6aca3ec764139bf30d00f20f',
        'slug': 'ancient-root-colossus-tough-phone-case.jpg',
        'theme': 'Ancient Root Colossus',
        'title': 'Ancient Root Colossus Tough Phone Case | Treant Forest Golem Fantasy Armor',
        'short_title': 'Ancient Root Colossus Tough Phone Case',
        'description': (
            'Guard your device with primordial strength using the Ancient Root Colossus Tough Phone Case. '
            'Depicting a towering moss-clad treant colossus with glowing amber heartwood runes rising from a misty primeval ravine, '
            'paired with heavy-duty dual-layer polycarbonate + TPU drop protection and raised camera lip. '
            'Fits iPhone 11–18 & Samsung Galaxy S22–S26.'
        ),
        'keywords': 'ancient root colossus, treant phone case, forest golem iphone case, earth elemental art, dnd druid phone case, dark fantasy nature case, giant tree guardian, tough armor phone case, gamer fantasy gift, iphone 16 pro max tough case, samsung s24 ultra case, mythical colossus art, mossy rune aesthetic',
        'artwork_file': '/designs/CASE-ROOTCO-001_9x16_Artwork.png',
    },
    {
        'sku': 'CASE-BEARNO-001',
        'printify_id': '6aca3ed4804a2b3c390a05ed',
        'slug': 'the-ancient-bear-of-the-wild-north-tough-phone-case.jpg',
        'theme': 'The Ancient Bear of the Wild North',
        'title': 'The Ancient Bear of the Wild North Tough Phone Case | Nordic Aurora Spirit',
        'short_title': 'The Ancient Bear of the Wild North Tough Phone Case',
        'description': (
            'Embrace the untamed power of the arctic wilderness with The Ancient Bear of the Wild North Tough Phone Case. '
            'Featuring a colossal frost-armored spirit bear etched with glowing cyan Nordic runes beneath the Aurora Borealis, '
            'crafted with dual-layer shockproof TPU + polycarbonate armor and vivid 300 DPI edge-to-edge print. '
            'Fits 34 iPhone & Samsung models.'
        ),
        'keywords': 'ancient bear phone case, wild north bear art, nordic rune phone case, aurora borealis iphone case, spirit bear gift, viking mythology case, grizzly guardian art, arctic wildlife case, tough protective phone case, iphone 16 pro max case, samsung s25 case, winter wilderness aesthetic, bear lover gift',
        'artwork_file': '/designs/CASE-BEARNO-001_9x16_Artwork.png',
    },
]

PINTEREST_HEADERS = [
    'Product ID',
    'Title',
    'Description',
    'Media URL',
    'Pinterest board',
    'Thumbnail',
    'Link',
    'Publish date',
    'Keywords',
]

base_date = datetime.utcnow().date() + timedelta(days=1)
default_link = 'https://www.etsy.com/shop/CraftCasesStudio?utm_source=pinterest&utm_medium=social&utm_campaign=mystical_forest_collection'
board_name = 'Phone Cases'

rows_5_primary = []
rows_30_all_6 = []
manifest_products = []

for p_idx, prod in enumerate(PRODUCTS):
    pid = prod['printify_id']
    slug = prod['slug']
    pub_date = (base_date + timedelta(days=p_idx)).isoformat()

    mockup_items = []
    for m_idx, m in enumerate(SELECTED_6_MOCKUPS):
        url = f"https://images.printify.com/mockup/{pid}/{m['variant_id']}/{m['camera_id']}/{slug}?camera_label={m['camera_label']}"
        mockup_items.append({
            'key': m['key'],
            'label': m['label'],
            'variant_id': m['variant_id'],
            'camera_id': m['camera_id'],
            'camera_label': m['camera_label'],
            'url': url,
        })

        pin_title = prod['title'] if m_idx == 0 else f"{prod['short_title']} — {m['label']}"
        if len(pin_title) > 100:
            pin_title = pin_title[:97] + '...'

        row = {
            'Product ID': f"{prod['sku']}-{m['camera_label'].upper()}-{m_idx+1}",
            'Title': pin_title,
            'Description': prod['description'][:700],
            'Media URL': url,
            'Pinterest board': board_name,
            'Thumbnail': '',
            'Link': f"{default_link}&utm_content={prod['sku'].lower()}_{m['key']}",
            'Publish date': (base_date + timedelta(days=p_idx, hours=m_idx * 4)).strftime('%Y-%m-%d'),
            'Keywords': prod['keywords'],
        }
        rows_30_all_6.append(row)
        if m_idx == 0:
            primary_row = dict(row)
            primary_row['Product ID'] = prod['sku']
            rows_5_primary.append(primary_row)

    manifest_products.append({
        **prod,
        'selected_6_mockups': mockup_items,
    })

def write_pinterest_csv(filepath, rows):
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=PINTEREST_HEADERS, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    print(f"Wrote {len(rows)} rows to {filepath}")

# Write both 5-pin (1 primary per design) and 30-pin (all 6 selected mockups per design) CSVs
write_pinterest_csv('CaseCraft_Pinterest_Bulk_Pins.csv', rows_30_all_6)
write_pinterest_csv('public/CaseCraft_Pinterest_Bulk_Pins.csv', rows_30_all_6)

write_pinterest_csv('CaseCraft_Pinterest_5_Master_Pins.csv', rows_5_primary)
write_pinterest_csv('public/CaseCraft_Pinterest_5_Master_Pins.csv', rows_5_primary)

write_pinterest_csv('CaseCraft_Pinterest_30_All_6_Mockups_Pins.csv', rows_30_all_6)
write_pinterest_csv('public/CaseCraft_Pinterest_30_All_6_Mockups_Pins.csv', rows_30_all_6)

with open('public/pinterest_5_designs_6_mockups.json', 'w', encoding='utf-8') as f:
    json.dump({'selected_6_mockups': SELECTED_6_MOCKUPS, 'products': manifest_products}, f, indent=2)
print("Wrote public/pinterest_5_designs_6_mockups.json")
