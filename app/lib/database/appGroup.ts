import { NativeModules, Platform } from 'react-native';

const { AppGroup } = NativeModules;

export const appGroupPath: string = Platform.OS === 'ios' ? AppGroup.path : '';
