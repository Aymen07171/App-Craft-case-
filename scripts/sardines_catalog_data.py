"""
scripts/sardines_catalog_data.py
Defines the complete metadata for all 10 Portuguese Sardinhas (Sardine) designs:
SKU, title, description, tags, palette, and style specifications.
"""

SARDINES_10_DESIGNS = [
    {
        "sku": "CASE-SARDPT-001",
        "title": "The Porto Classic Sardinhas in Olive Oil Tough Phone Case",
        "description": "Iconic Porto classic canned sardines in pure golden olive oil framed by ornate handcrafted blue-and-white Portuguese Baroque Azulejo ceramic tiles, fresh Mediterranean lemon slices, and olive sprigs. Premium dual-layer Tough Case with impact-resistant polycarbonate backplate.",
        "tags": ["portuguese sardines", "porto azulejo case", "sardinhas case", "blue tile phone case", "portugal travel gift", "lisbon souvenir", "azulejo tile art", "olive oil sardine", "vintage tin case", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "mediterranean art"],
        "artwork_glob": "porto_classic_sardinhas_*.jpg",
    },
    {
        "sku": "CASE-SARDPT-002",
        "title": "Galo de Barcelos Portuguese Rooster Spicy Sardines Tough Case",
        "description": "Traditional Portuguese folk art Galo de Barcelos lucky rooster perched proudly atop a vintage crimson sardine tin with fiery piri-piri chili peppers, hearts, and floral motifs. Dual-layer shock-absorbing Tough Case.",
        "tags": ["galo de barcelos", "portuguese rooster", "piri piri sardines", "portugal folk art", "spicy sardine case", "barcelos rooster", "lisbon souvenir", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "portuguese gift", "retro tin can", "portugal pride"],
        "artwork_glob": "*barcelos*rooster*.jpg",
    },
    {
        "sku": "CASE-SARDPT-003",
        "title": "Algarve Coastal Fisherman Morning Haul Sardines Tough Case",
        "description": "Vintage maritime nautical woodcut illustration of a weathered Portuguese fisherman in a traditional barrete wool cap hauling shimmering silver Atlantic sardines into a rustic coastal tin. Heavy-duty dual-layer Tough Case.",
        "tags": ["algarve fisherman", "nautical phone case", "sardine haul tin", "portugal coast art", "atlantic sardines", "fisherman gift", "vintage maritime", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "ocean beach case", "portuguese sea art", "coastal decor"],
        "artwork_glob": "*algarve*fisherman*.jpg",
    },
    {
        "sku": "CASE-SARDPT-004",
        "title": "Fado Night Sardinhas and Portuguese Guitar Tough Phone Case",
        "description": "Atmospheric midnight lithograph featuring a traditional 12-string Guitarra Portuguesa resting against an open vintage sardine tin in the cobbled lantern-lit alleyways of Alfama Lisbon. Protective dual-layer Tough Case.",
        "tags": ["fado music case", "guitarra portuguesa", "alfama lisbon case", "fado night sardines", "portuguese guitar", "lisbon fado gift", "midnight lithograph", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "portugal music lover", "romantic lisbon", "vintage fado"],
        "artwork_glob": "*fado*guitar*.jpg",
    },
    {
        "sku": "CASE-SARDPT-005",
        "title": "Tram 28 Lisbon Sardine Express Vintage Travel Tough Case",
        "description": "Vintage European travel poster styling showcasing the iconic yellow Lisbon Tram 28 reimagined as a retro Sardinhas de Lisboa tin gliding over sunlit Portuguese cobblestone streets. Durable dual-layer Tough Case.",
        "tags": ["tram 28 lisbon", "yellow tram case", "sardinhas de lisboa", "lisbon travel poster", "portugal wanderlust", "vintage travel tin", "tram 28 souvenir", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "lisbon city case", "european traveler", "street tram art"],
        "artwork_glob": "*tram*28*.jpg",
    },
    {
        "sku": "CASE-SARDPT-006",
        "title": "Azulejo Tile Mosaic Silver Pilchard Trio Tough Phone Case",
        "description": "Harmonious circular Yin-Yang swimming medallion of three sleek silver sardines set in an authentic cobalt-blue and white geometric Portuguese Azulejo ceramic tile mosaic. Dual-layer impact-resistant Tough Case.",
        "tags": ["azulejo tile mosaic", "silver sardines case", "pilchard trio art", "portuguese ceramic", "delft blue tile", "yinyang fish case", "minimalist tile art", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "mediterranean tile", "lisbon aesthetic", "geometric fish"],
        "artwork_glob": "*azulejo*pilchard*.jpg",
    },
    {
        "sku": "CASE-SARDPT-007",
        "title": "Belem Tower Maritime Sardine Cannery Label Tough Case",
        "description": "19th-century royal archival engraving of Lisbon's historic Torre de Belém fortress framed by the Portuguese royal coat of arms, maritime armillary spheres, and vintage Conservas Reais typography. Tough Case.",
        "tags": ["belem tower case", "torre de belem", "conservas reais", "royal sardine tin", "portugal history art", "vintage engraving", "lisbon monument", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "archival travel case", "architecture lover", "portuguese empire"],
        "artwork_glob": "*belem*tower*.jpg",
    },
    {
        "sku": "CASE-SARDPT-008",
        "title": "Sardinha com Pimentos Grilled Pepper Sardine Fest Tough Case",
        "description": "Sizzling Santos Populares street festival celebration featuring charred grilled sardines served over rustic broa cornbread with charred red and green bell peppers and summer festival garland. Durable Tough Case.",
        "tags": ["sardinha com pimentos", "grilled sardines", "santos populares", "festa de lisboa", "portuguese food art", "sardine festival", "broa cornbread", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "foodie phone case", "portugal summer fest", "lisbon street food"],
        "artwork_glob": "*sardinha*pimentos*.jpg",
    },
    {
        "sku": "CASE-SARDPT-009",
        "title": "Madeira Island Exotic Passion Fruit Sardine Tough Case",
        "description": "Botanical Art Nouveau vintage sardine tin label adorned with exotic Madeira passion fruit blossoms, lush banana leaves, and rugged Atlantic volcanic cliffs. Protective dual-layer Tough Case.",
        "tags": ["madeira island case", "passion fruit tin", "botanical art nouveau", "tropical sardine", "portugal islands", "madeira flower fest", "atlantic island art", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "funchal souvenir", "exotic botanical", "volcanic cliffs"],
        "artwork_glob": "*madeira*passion*.jpg",
    },
    {
        "sku": "CASE-SARDPT-010",
        "title": "Cascais Riviera Sunbather Sardine Picnic Tough Case",
        "description": "Chic 1950s Mid-Century French-Portuguese Riviera gouache featuring cat-eye sunglasses, striped beach cabana umbrella, and a golden sardine tin on a sun-drenched Cascais sandy beach towel. Dual-layer Tough Case.",
        "tags": ["cascais riviera", "beach picnic case", "retro sunbather", "mid century gouache", "portugal beach case", "coastal summer tin", "vintage 1950s resort", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "summer vacation gift", "estoril coast", "sandy beach picnic"],
        "artwork_glob": "*cascais*riviera*.jpg",
    },
]
