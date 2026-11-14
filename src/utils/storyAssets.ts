import heroMockupImg from '../assets/images/hero_storybook_mockup_1794606419841.jpg';
import desertStarsImg from '../assets/images/story_cover_desert_stars_1794606419537.jpg';
import oliveGroveImg from '../assets/images/story_cover_olive_grove_1794606418971.jpg';
import seaAdventureImg from '../assets/images/story_cover_sea_adventure_1794606420210.jpg';
import interiorSpreadImg from '../assets/images/story_interior_spread_1794606420124.jpg';
import sciFiCosmosImg from '../assets/images/story_cover_sci_fi_cosmos_1794607446701.jpg';
import sportsChampionImg from '../assets/images/story_cover_sports_champion_1794607447333.jpg';
import dinosaursWorldImg from '../assets/images/story_cover_dinosaurs_world_1794607961617.jpg';
import tunisiaHeritageImg from '../assets/images/story_cover_tunisia_heritage_1794607964292.jpg';
import stemInventorImg from '../assets/images/story_cover_stem_inventor_1794607963443.jpg';

const ASSET_MAP: Record<string, string> = {
  '/src/assets/images/hero_storybook_mockup_1794606419841.jpg': heroMockupImg,
  '/src/assets/images/story_cover_desert_stars_1794606419537.jpg': desertStarsImg,
  '/src/assets/images/story_cover_olive_grove_1794606418971.jpg': oliveGroveImg,
  '/src/assets/images/story_cover_sea_adventure_1794606420210.jpg': seaAdventureImg,
  '/src/assets/images/story_interior_spread_1794606420124.jpg': interiorSpreadImg,
  '/src/assets/images/story_cover_sci_fi_cosmos_1794607446701.jpg': sciFiCosmosImg,
  '/src/assets/images/story_cover_sports_champion_1794607447333.jpg': sportsChampionImg,
  '/src/assets/images/story_cover_dinosaurs_world_1794607961617.jpg': dinosaursWorldImg,
  '/src/assets/images/story_cover_tunisia_heritage_1794607964292.jpg': tunisiaHeritageImg,
  '/src/assets/images/story_cover_stem_inventor_1794607963443.jpg': stemInventorImg,
};

export const STUDIO_ASSET_PRESETS: Array<{ path: string; labelAr: string; labelFr: string; labelEn: string }> = [
  {
    path: '/src/assets/images/hero_storybook_mockup_1794606419841.jpg',
    labelAr: 'غلاف المتجر الرئيسي',
    labelFr: 'Visuel principal',
    labelEn: 'Hero Storybook Mockup',
  },
  {
    path: '/src/assets/images/story_cover_desert_stars_1794606419537.jpg',
    labelAr: 'نجوم الصحراء',
    labelFr: 'Étoiles du Désert',
    labelEn: 'Desert Stars',
  },
  {
    path: '/src/assets/images/story_cover_olive_grove_1794606418971.jpg',
    labelAr: 'غابة الزيتون',
    labelFr: 'Oliveraie Magique',
    labelEn: 'Olive Grove',
  },
  {
    path: '/src/assets/images/story_cover_sea_adventure_1794606420210.jpg',
    labelAr: 'القارب السحري',
    labelFr: 'Petit Bateau',
    labelEn: 'Magic Boat',
  },
  {
    path: '/src/assets/images/story_cover_sci_fi_cosmos_1794607446701.jpg',
    labelAr: 'مغامرة الفضاء',
    labelFr: 'Cosmos & Fusée',
    labelEn: 'Sci-Fi Cosmos',
  },
  {
    path: '/src/assets/images/story_cover_sports_champion_1794607447333.jpg',
    labelAr: 'أبطال الرياضة',
    labelFr: 'Champions du Stade',
    labelEn: 'Sports Champions',
  },
  {
    path: '/src/assets/images/story_cover_dinosaurs_world_1794607961617.jpg',
    labelAr: 'عالم الديناصورات',
    labelFr: 'Monde des Dinosaures',
    labelEn: 'Dinosaurs World',
  },
  {
    path: '/src/assets/images/story_cover_tunisia_heritage_1794607964292.jpg',
    labelAr: 'التراث التونسي',
    labelFr: 'Patrimoine Tunisien',
    labelEn: 'Tunisia Heritage',
  },
  {
    path: '/src/assets/images/story_cover_stem_inventor_1794607963443.jpg',
    labelAr: 'ورشة المخترع الصغير',
    labelFr: 'Atelier du Petit Inventeur',
    labelEn: 'STEM Inventor Workshop',
  },
  {
    path: '/src/assets/images/story_interior_spread_1794606420124.jpg',
    labelAr: 'حديقة الفوانيس / صفحات داخلية',
    labelFr: 'Jardin des Lanternes',
    labelEn: 'Lantern Garden / Spread',
  },
];

export function resolveStoryAssetUrl(src: string): string {
  return ASSET_MAP[src] ?? src;
}
