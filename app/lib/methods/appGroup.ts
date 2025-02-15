import { Paths } from 'expo-file-system/next';
import { Platform } from 'react-native';


export const appGroupPath: string = Platform.OS === 'ios' ? Object.values(Paths.appleSharedContainers)?.[0]?.uri : '';

export const appGroupSuiteName: string = Platform.OS === 'ios' ? Object.values(Paths.appleSharedContainers)?.[0]?.name : '';
