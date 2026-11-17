import { hasNativeHeaderBar } from '~/lib/methods/helpers/deviceInfo';
import { useJsRoomsListHeader } from './useJsRoomsListHeader';
import { useNativeRoomsListHeader } from './useNativeRoomsListHeader';

export const useHeader = hasNativeHeaderBar ? useNativeRoomsListHeader : useJsRoomsListHeader;
