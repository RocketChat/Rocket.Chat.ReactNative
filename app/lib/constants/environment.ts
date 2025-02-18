import Constants from 'expo-constants';
import { Platform } from 'react-native';


export const isFDroidBuild = Platform.OS === 'android' && Constants.expoConfig?.extra?.isFDroidBuild;

export const isOfficial = !__DEV__;
