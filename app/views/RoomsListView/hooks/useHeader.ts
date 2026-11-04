import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { useJsRoomsListHeader } from './useJsRoomsListHeader';
import { useNativeRoomsListHeader } from './useNativeRoomsListHeader';

export const useHeader = hasNativeHeaderBar ? useNativeRoomsListHeader : useJsRoomsListHeader;
