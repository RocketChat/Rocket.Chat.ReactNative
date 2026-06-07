import { useIsScreenReaderEnabled } from './useIsScreenReaderEnabled';
import { isExternalKeyboardConnected } from '../methods/helpers/externalInput';

/**
 * Accessibility navigation is active when the user drives the UI with a screen reader or a
 * physical keyboard. Use it to decide when focus should be moved programmatically (e.g. onto
 * the room header when a room opens) instead of yanking focus around for regular touch users.
 */
export const useIsAccessibilityNavigationEnabled = (): boolean => {
	const isScreenReaderEnabled = useIsScreenReaderEnabled();
	return isScreenReaderEnabled || isExternalKeyboardConnected();
};
