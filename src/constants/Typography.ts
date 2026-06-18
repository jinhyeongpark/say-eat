import { Platform } from 'react-native';

export const FF = Platform.OS === 'web'
  ? "'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif"
  : 'Apple SD Gothic Neo';
