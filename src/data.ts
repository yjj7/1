import { Scene } from './types';
import morningWindow from './assets/images/balanced_morning_window_1780054756807.png';
import rainyCafe from './assets/images/real_rainy_cafe_1780056007513.png';
import nightLibrary from './assets/images/real_night_study_1780056022466.png';
import seasideStudy from './assets/images/balanced_seaside_study_1780054805083.png';
import nightHomeOffice from './assets/images/night_home_office_1780054791759.png';

// 音频标识符：synth:xxx 格式由 audioManager 合成，custom 为用户自定义上传
export const MUSIC_TRACKS = [
  {
    id: 'gymnopédie',
    title: 'Gymnopédie - Satie',
    audioUrl: 'synth:gymnopedie'
  },
  {
    id: 'clair_de_lune',
    title: 'Clair de Lune - Debussy',
    audioUrl: 'synth:clair'
  },
  {
    id: 'lofi_calm',
    title: 'Lofi - 轻柔节拍',
    audioUrl: 'synth:lofi'
  },
  {
    id: 'focus_piano',
    title: '专注钢琴',
    audioUrl: 'synth:piano'
  },
  {
    id: 'jazz_piano',
    title: '爵士钢琴',
    audioUrl: 'synth:jazz'
  },
  {
    id: 'ambient_pad',
    title: '氛围电子',
    audioUrl: 'synth:ambient'
  },
  {
    id: 'classical_guitar',
    title: '古典吉他',
    audioUrl: 'synth:guitar'
  },
  {
    id: 'meditation',
    title: '冥想音律',
    audioUrl: 'synth:meditation'
  },
  {
    id: 'nature_white_noise',
    title: '自然白噪音',
    audioUrl: 'synth:nature'
  },
  {
    id: 'cafe_ambience',
    title: '咖啡厅环境音',
    audioUrl: 'synth:cafe'
  },
  {
    id: 'custom',
    title: '🎵 自定义音乐',
    audioUrl: 'custom'
  },
  {
    id: 'none',
    title: '无音乐 (Mute)',
    audioUrl: ''
  },
];

export const SCENES: Scene[] = [
  {
    id: 'morning_window',
    title: '清晨窗边',
    description: '晨光、植物、安静书桌',
    details: '鸟鸣与微风',
    imageUrl: morningWindow,
    audioUrl: 'synth:bg:birds'
  },
  {
    id: 'rainy_cafe',
    title: '雨天咖啡店',
    description: '暖灯、咖啡、低声环境',
    details: '雨声与隐约人声',
    imageUrl: rainyCafe,
    audioUrl: 'synth:bg:rain'
  },
  {
    id: 'night_library',
    title: '深夜书房',
    description: '窗边、台灯、专属空间',
    details: '寂静与翻书声',
    imageUrl: nightLibrary,
    audioUrl: 'synth:bg:silence'
  },
  {
    id: 'seaside_study',
    title: '海边书房',
    description: '海风、蓝光、开阔视野',
    details: '海浪与微风',
    imageUrl: seasideStudy,
    audioUrl: 'synth:bg:ocean'
  },
  {
    id: 'deep_night_desk',
    title: '深夜书桌',
    description: '台灯、笔记本、安静深夜',
    details: '键盘声与翻书声',
    imageUrl: nightHomeOffice,
    audioUrl: 'synth:bg:keyboard'
  },
  {
    id: 'forest_cabin',
    title: '森林小屋',
    description: '木屋、壁炉、森林气息',
    details: '柴火燃烧与鸟鸣',
    imageUrl: seasideStudy, // TODO: 需替换为森林/木屋场景图
    audioUrl: 'synth:bg:forest'
  },
  {
    id: 'city_skyline',
    title: '城市天际线',
    description: '高楼、霓虹、城市夜景',
    details: '远处车流与城市脉搏',
    imageUrl: rainyCafe, // TODO: 需替换为城市天际线场景图
    audioUrl: 'synth:bg:city'
  },
];

export const DURATIONS = [25, 45, 50, 90];
