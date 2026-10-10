const XLSX = require('xlsx');
const path = require('path');

// Sheet 1: 4 newly generated designs + sample entries
const productsData = [
  {
    'Product ID': 'CASE-001',
    'Product Template': 'Tough Phone Cases',
    'Blueprint ID': 269,
    'Print Provider': 'Printify Choice',
    'Provider ID': 99,
    'Variants / Phone Models': 'All 34 Tough Case Models (All iPhones & Samsung)',
    'Title': 'Stained Glass Woodland Fox Tough Phone Case, Cathedral Vitrail Autumn Fox Cover',
    'Description': 'Premium double-layer protective tough phone case featuring vibrant stained glass cathedral fox artwork. Impact-resistant polycarbonate outer shell with shock-absorbing TPU interior liner. UV-protected full bleed dye-sublimation wrap print with precision camera and port cutouts.',
    'Tags': 'stained glass case, woodland fox, aesthetic iphone case, tough phone case, autumn leaves, cottagecore case, animal artwork, gift for her, phone cover',
    'Design Image': 'stained_glass_fox.jpg',
    'Design Image Path': 'public/designs/stained_glass_fox.jpg',
    'Google Drive Folder': 'https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO?usp=sharing',
    'Price': 24.99,
    'SKU': 'FOX-VITRAIL-TOUGH',
  },
  {
    'Product ID': 'CASE-002',
    'Product Template': 'Tough Phone Cases',
    'Blueprint ID': 269,
    'Print Provider': 'Printify Choice',
    'Provider ID': 99,
    'Variants / Phone Models': 'All 34 Tough Case Models (All iPhones & Samsung)',
    'Title': 'Anime Pirate Great Wave Tough Phone Case, Mucha Tarot Sea Captain Japanese Art Cover',
    'Description': 'Heroic anime pirate captain touching his straw hat against surging Japanese ukiyo-e Great Waves and cherry blossom petals in an Alphonse Mucha tarot poster style. Dual-layer armor case engineered for maximum drop resistance.',
    'Tags': 'anime phone case, pirate captain, great wave off kanagawa, tarot card case, mucha art nouveau, manga phone case, japanese wave art, aesthetic tough case',
    'Design Image': 'anime_wave_pirate.jpg',
    'Design Image Path': 'public/designs/anime_wave_pirate.jpg',
    'Google Drive Folder': 'https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO?usp=sharing',
    'Price': 24.99,
    'SKU': 'PIRATE-WAVE-TOUGH',
  },
  {
    'Product ID': 'CASE-003',
    'Product Template': 'Tough Phone Cases',
    'Blueprint ID': 269,
    'Print Provider': 'Printify Choice',
    'Provider ID': 99,
    'Variants / Phone Models': 'All 34 Tough Case Models (All iPhones & Samsung)',
    'Title': 'Celestial Witch and Spirit Wolf Tough Case, Gothic Stained Glass Magic Familiar Cover',
    'Description': 'Ethereal anime witch maiden with crystal staff accompanied by a luminous cyan spirit wolf familiar in a magical amethyst forest beneath a gothic cathedral rose-window mandala. Polycarbonate hard shell with black silicone inner cushion.',
    'Tags': 'witch phone case, spirit wolf, gothic stained glass, fantasy artwork, celestial magic, pagan phone cover, anime witch aesthetic, protective tough case',
    'Design Image': 'celestial_witch_wolf.jpg',
    'Design Image Path': 'public/designs/celestial_witch_wolf.jpg',
    'Google Drive Folder': 'https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO?usp=sharing',
    'Price': 24.99,
    'SKU': 'WITCH-WOLF-TOUGH',
  },
  {
    'Product ID': 'CASE-004',
    'Product Template': 'Tough Phone Cases',
    'Blueprint ID': 269,
    'Print Provider': 'Printify Choice',
    'Provider ID': 99,
    'Variants / Phone Models': 'All 34 Tough Case Models (All iPhones & Samsung)',
    'Title': 'Kitsune Samurai Stained Glass Tough Phone Case, Fox Mask Japanese Warrior Blood Moon Cover',
    'Description': 'Masked kitsune samurai warrior in embroidered haori holding a katana, surrounded by floating cyan will-o-wisps and blooming red spider lilies (higanbana) under a radiant blood moon. Premium 3D wrap dye sublimation print.',
    'Tags': 'kitsune samurai, fox mask case, japanese warrior, red spider lily, higanbana art, blood moon cover, stained glass vitrail, anime armor case',
    'Design Image': 'kitsune_samurai.jpg',
    'Design Image Path': 'public/designs/kitsune_samurai.jpg',
    'Google Drive Folder': 'https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO?usp=sharing',
    'Price': 24.99,
    'SKU': 'KITSUNE-SAMURAI-TOUGH',
  },
];

// Sheet 2: 34 Tough Phone Cases (Blueprint 269) models
const toughModelsData = [
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 18 Pro Max', 'Variant ID': 107200, 'Print Area (px)': '2400 x 4800', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 18 Pro', 'Variant ID': 107201, 'Print Area (px)': '2200 x 4400', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 18 Plus', 'Variant ID': 107202, 'Print Area (px)': '2400 x 4800', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 18', 'Variant ID': 107203, 'Print Area (px)': '2200 x 4400', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 17 Pro Max', 'Variant ID': 105100, 'Print Area (px)': '2350 x 4700', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 17 Pro', 'Variant ID': 105101, 'Print Area (px)': '2150 x 4300', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 17 Plus', 'Variant ID': 105102, 'Print Area (px)': '2350 x 4700', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 17', 'Variant ID': 105103, 'Print Area (px)': '2150 x 4300', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 16 Pro Max', 'Variant ID': 102145, 'Print Area (px)': '2324 x 4624', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 16 Pro', 'Variant ID': 102144, 'Print Area (px)': '2136 x 4248', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 16 Plus', 'Variant ID': 102143, 'Print Area (px)': '2324 x 4624', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 16', 'Variant ID': 102142, 'Print Area (px)': '2136 x 4248', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 15 Pro Max', 'Variant ID': 96256, 'Print Area (px)': '2312 x 4596', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 15 Pro', 'Variant ID': 96255, 'Print Area (px)': '2124 x 4220', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 15 Plus', 'Variant ID': 96254, 'Print Area (px)': '2312 x 4596', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 15', 'Variant ID': 96253, 'Print Area (px)': '2124 x 4220', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 14 Pro Max', 'Variant ID': 88412, 'Print Area (px)': '2312 x 4596', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 14 Pro', 'Variant ID': 88411, 'Print Area (px)': '2124 x 4220', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 14 Plus', 'Variant ID': 88410, 'Print Area (px)': '2312 x 4596', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 14', 'Variant ID': 88409, 'Print Area (px)': '2124 x 4220', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 13 Pro Max', 'Variant ID': 74820, 'Print Area (px)': '2312 x 4596', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 13 Pro', 'Variant ID': 74819, 'Print Area (px)': '2124 x 4220', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 13', 'Variant ID': 74818, 'Print Area (px)': '2124 x 4220', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 13 mini', 'Variant ID': 74817, 'Print Area (px)': '1850 x 3720', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 12 Pro Max', 'Variant ID': 61204, 'Print Area (px)': '2312 x 4596', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 12 / 12 Pro', 'Variant ID': 61203, 'Print Area (px)': '2124 x 4220', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Apple iPhone', 'Model Name': 'iPhone 11', 'Variant ID': 45102, 'Print Area (px)': '2100 x 4200', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Samsung Galaxy', 'Model Name': 'Samsung Galaxy S26 Ultra', 'Variant ID': 108100, 'Print Area (px)': '2400 x 4850', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Samsung Galaxy', 'Model Name': 'Samsung Galaxy S26+', 'Variant ID': 108101, 'Print Area (px)': '2300 x 4700', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Samsung Galaxy', 'Model Name': 'Samsung Galaxy S26', 'Variant ID': 108102, 'Print Area (px)': '2150 x 4400', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Samsung Galaxy', 'Model Name': 'Samsung Galaxy S25 Ultra', 'Variant ID': 104210, 'Print Area (px)': '2380 x 4800', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Samsung Galaxy', 'Model Name': 'Samsung Galaxy S25+', 'Variant ID': 104211, 'Print Area (px)': '2280 x 4680', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Samsung Galaxy', 'Model Name': 'Samsung Galaxy S25', 'Variant ID': 104212, 'Print Area (px)': '2140 x 4380', 'Aspect': '9:16', 'Status': 'Supported' },
  { 'Brand': 'Samsung Galaxy', 'Model Name': 'Samsung Galaxy S24 Ultra', 'Variant ID': 98450, 'Print Area (px)': '2380 x 4800', 'Aspect': '9:16', 'Status': 'Supported' },
];

// Sheet 3: Other Blueprints
const otherBlueprintsData = [
  { 'Template Name': 'Tough Phone Cases', 'Blueprint ID': 269, 'Default Provider': 'Printify Choice', 'Provider ID': 99, 'Case Type': 'Tough (Double Layer)', 'Decoration Method': 'Dye Sublimation (3D Wrap)', 'Print Area': 'Full Wrap', 'Supported Models': '34 Models (iPhone 18 to 11, Samsung S26 to S24)', 'Printify URL': 'https://printify.com/app/editor/269/99/dye-sublimation' },
  { 'Template Name': 'Slim Phone Cases', 'Blueprint ID': 268, 'Default Provider': 'Printify Choice', 'Provider ID': 99, 'Case Type': 'Slim (Snap-on)', 'Decoration Method': 'Dye Sublimation (3D Wrap)', 'Print Area': 'Full Wrap', 'Supported Models': '34 Models (iPhone 18 to 11, Samsung S26 to S24)', 'Printify URL': 'https://printify.com/app/editor/268/99/dye-sublimation' },
  { 'Template Name': 'Clear Phone Cases', 'Blueprint ID': 370, 'Default Provider': 'Printify Choice', 'Provider ID': 99, 'Case Type': 'Clear (Transparent Sides)', 'Decoration Method': 'UV Printing (Flat Back)', 'Print Area': 'Back Face Only', 'Supported Models': '32 Models (iPhone 18 to 7, Samsung S26 to S21)', 'Printify URL': 'https://printify.com/app/editor/370/99/uv-printing' },
  { 'Template Name': 'Wallet Phone Cases', 'Blueprint ID': 270, 'Default Provider': 'Printify Choice', 'Provider ID': 99, 'Case Type': 'Wallet Folio (Card Slots)', 'Decoration Method': 'UV Printing / Dye Sublimation', 'Print Area': 'Front & Back Cover', 'Supported Models': '20 Models (iPhones & Popular Samsung)', 'Printify URL': 'https://printify.com/app/editor/270/99' },
  { 'Template Name': 'Bio-degradable Eco Cases', 'Blueprint ID': 400, 'Default Provider': 'Printify Choice', 'Provider ID': 99, 'Case Type': 'Eco-Friendly Bamboo/Cornstarch', 'Decoration Method': 'UV Printing (Flat Back)', 'Print Area': 'Back Face Only', 'Supported Models': '18 Models (iPhone 16 to 11)', 'Printify URL': 'https://printify.com/app/editor/400/99' },
];

const workbook = XLSX.utils.book_new();

const productsWs = XLSX.utils.json_to_sheet(productsData);
productsWs['!cols'] = [
  { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
  { wch: 48 }, { wch: 50 }, { wch: 70 }, { wch: 55 }, { wch: 26 },
  { wch: 35 }, { wch: 35 }, { wch: 10 }, { wch: 22 }
];

const toughWs = XLSX.utils.json_to_sheet(toughModelsData);
toughWs['!cols'] = [
  { wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 20 }, { wch: 10 }, { wch: 12 }
];

const blueprintsWs = XLSX.utils.json_to_sheet(otherBlueprintsData);
blueprintsWs['!cols'] = [
  { wch: 26 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 26 },
  { wch: 32 }, { wch: 18 }, { wch: 48 }, { wch: 60 }
];

XLSX.utils.book_append_sheet(workbook, productsWs, 'Printify_Products');
XLSX.utils.book_append_sheet(workbook, toughWs, 'Tough_Cases_Models_269');
XLSX.utils.book_append_sheet(workbook, blueprintsWs, 'Other_Case_Blueprints');

// Target 1: Workspace root
const targetPath1 = path.resolve('Printify_Tough_Cases_Bulk_Import_Template.xlsx');
XLSX.writeFile(workbook, targetPath1);
console.log('Saved to workspace:', targetPath1);

// Target 2: User Downloads folder
const targetPath2 = 'C:/Users/jacka/Downloads/Printify_Tough_Cases_Bulk_Import_Template.xlsx';
XLSX.writeFile(workbook, targetPath2);
console.log('Saved to downloads:', targetPath2);
