import { Scene } from './types';
import morningWindow from './assets/images/balanced_morning_window_1780054756807.png';
import rainyCafe from './assets/images/real_rainy_cafe_1780056007513.png';
import nightLibrary from './assets/images/real_night_study_1780056022466.png';
import seasideStudy from './assets/images/balanced_seaside_study_1780054805083.png';

export const MUSIC_TRACKS = [
  {
    id: 'gymnopedie',
    title: 'Gymnopédie No. 1 - Satie',
    audioUrl: 'https://archive.org/download/gymnopedie-no-1-by-kevin-macleod/gymnopedie-no-1-by-kevin-macleod.mp3'
  },
  {
    id: 'clair_de_lune',
    title: 'Clair de Lune - Debussy',
    audioUrl: 'https://archive.org/download/debussy-clair-de-lune/Debussy%20-%20Clair%20de%20Lune.mp3'
  },
  {
    id: 'lofi_calm',
    title: 'Lofi - Calm Weave',
    audioUrl: 'https://archive.org/download/avalune-weightless-ambient-lofi-for-deep-focus-and-study/Calm%20Electronic%20Weave.mp3'
  },
  {
    id: 'none',
    title: '无音乐 (Mute Music)',
    audioUrl: ''
  }
];

export const SCENES: Scene[] = [
  {
    id: 'morning_window',
    title: '清晨窗边',
    description: '晨光、植物、安静书桌',
    details: '轻雨与窗外白鹭',
    imageUrl: morningWindow,
    audioUrl: 'https://archive.org/download/EarlyMorningMayBirdsSinging/vogels-mei2008-5uursochtends.mp3'
  },
  {
    id: 'rainy_cafe',
    title: '雨天咖啡店',
    description: '暖灯、咖啡、低声环境',
    details: '雨声与隐约环境',
    imageUrl: rainyCafe,
    audioUrl: 'https://archive.org/download/rain-and-storm-19591/rain-and-storm-19591.mp3'
  },
  {
    id: 'night_library',
    title: '深夜书房',
    description: '窗边、台灯、专属空间',
    details: '寂静白噪音',
    imageUrl: nightLibrary,
    audioUrl: 'https://archive.org/download/cathedral-library-ii-ambient-choir-wind-sound-of-burning-candles-asmr/CATHEDRAL%20LIBRARY%20II%20%20Ambient%20Choir%2C%20Wind%2C%20Sound%20Of%20Burning%20Candles%20%20ASMR.mp3'
  },
  {
    id: 'seaside_study',
    title: '海边书房',
    description: '海风、蓝光、开阔视野',
    details: '海浪与微风',
    imageUrl: seasideStudy,
    audioUrl: 'https://archive.org/download/ocean-waves-112906/ocean-waves-112906.mp3'
  }
];

export const DURATIONS = [25, 45, 50, 90];
