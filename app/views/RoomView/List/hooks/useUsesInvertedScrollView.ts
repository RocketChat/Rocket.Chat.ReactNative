import { useIsScreenReaderEnabled } from '~/lib/hooks/useIsScreenReaderEnabled';
import { isIOS } from '~/lib/methods/helpers/deviceInfo';
import { isExternalKeyboardConnected } from '~/lib/methods/helpers/externalInput';

export const useUsesInvertedScrollView = (): boolean => {
	const isScreenReaderEnabled = useIsScreenReaderEnabled();
	return !isIOS && (isScreenReaderEnabled || isExternalKeyboardConnected());
};
