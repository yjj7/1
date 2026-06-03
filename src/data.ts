import { Scene } from './types';
import morningWindow from './assets/images/balanced_morning_window_1780054756807.png';
import rainyCafe from './assets/images/real_rainy_cafe_1780056007513.png';
import nightLibrary from './assets/images/real_night_study_1780056022466.png';
import seasideStudy from './assets/images/balanced_seaside_study_1780054805083.png';
import nightHomeOffice from './assets/images/night_home_office_1780054791759.png';
import forestCabin from './assets/images/forest_cabin.svg';
import citySkyline from './assets/images/city_skyline.svg';

export const MUSIC_TRACKS = [
  { id: 'gymnopedie', title: 'Gymnopedie - Satie', audioUrl: '/music/01-gymnopedie.mp3' },
  { id: 'clair_de_lune', title: 'Clair de Lune - Debussy', audioUrl: '/music/02-clair-de-lune.mp3' },
  { id: 'lofi_calm', title: 'Lofi - 轻柔节拍', audioUrl: '/music/03-lofi-calm.mp3' },
  { id: 'focus_piano', title: '专注钢琴', audioUrl: '/music/04-focus-piano.mp3' },
  { id: 'jazz_piano', title: '爵士钢琴', audioUrl: '/music/05-jazz-piano.mp3' },
  { id: 'ambient_pad', title: '氛围电子', audioUrl: '/music/06-ambient-pad.mp3' },
  { id: 'classical_guitar', title: '古典吉他', audioUrl: '/music/07-classical-guitar.mp3' },
  { id: 'meditation', title: '冥想音律', audioUrl: '/music/08-meditation.mp3' },
  { id: 'nature_white_noise', title: '自然白噪音', audioUrl: '/music/09-rain-piano.mp3' },
  { id: 'cafe_ambience', title: '咖啡厅环境音', audioUrl: '/music/10-cafe-ambient.mp3' },
  { id: 'custom', title: '自定义音乐', audioUrl: 'custom' },
  { id: 'none', title: '无音乐 (Mute)', audioUrl: '' },
];

export const SCENES: Scene[] = [
  { id: 'morning_window', title: '清晨窗边', description: '晨光、植物、安静书桌', details: '鸟鸣与微风', imageUrl: morningWindow, audioUrl: '/sounds/birds.mp3' },
  { id: 'rainy_cafe', title: '雨天咖啡店', description: '暖灯、咖啡、低声环境', details: '雨声与隐约人声', imageUrl: rainyCafe, audioUrl: '/sounds/rain.mp3' },
  { id: 'night_library', title: '深夜书房', description: '窗边、台灯、专属空间', details: '寂静与翻书声', imageUrl: nightLibrary, audioUrl: '' },
  { id: 'seaside_study', title: '海边书房', description: '海风、蓝光、开阔视野', details: '海浪与微风', imageUrl: seasideStudy, audioUrl: '/sounds/ocean.mp3' },
  { id: 'deep_night_desk', title: '深夜书桌', description: '台灯、笔记本、安静深夜', details: '键盘声与翻书声', imageUrl: nightHomeOffice, audioUrl: '/sounds/keyboard.mp3' },
  { id: 'forest_cabin', title: '森林小屋', description: '木屋、壁炉、森林气息', details: '柴火燃烧与鸟鸣', imageUrl: forestCabin, audioUrl: '/sounds/forest.mp3' },
  { id: 'city_skyline', title: '城市天际线', description: '高楼、霓虹、城市夜景', details: '远处车流与城市脉搏', imageUrl: citySkyline, audioUrl: '/sounds/cafe.mp3' },
];

export const DURATIONS = [25, 45, 50, 90];

export const NOISE_PRESETS = [
  { id: 'rain', label: '雨声', icon: '🌧️' },
  { id: 'thunder', label: '雷声', icon: '⛈️' },
  { id: 'fire', label: '壁炉', icon: '🔥' },
  { id: 'wind', label: '风声', icon: '🌬️' },
  { id: 'birds', label: '鸟鸣', icon: '🐦' },
  { id: 'ocean', label: '海浪', icon: '🌊' },
  { id: 'cafe', label: '咖啡厅', icon: '☕' },
  { id: 'keyboard', label: '键盘声', icon: '⌨️' },
  { id: 'forest', label: '森林', icon: '🌲' },
  { id: 'white', label: '白噪音', icon: '📻' },
  { id: 'pink', label: '粉噪音', icon: '🔊' },
  { id: 'brown', label: '棕噪音', icon: '🎧' },
] as const;
