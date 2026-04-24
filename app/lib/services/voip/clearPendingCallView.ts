import { useCallStore } from './useCallStore';
import Navigation from '../../navigation/appNavigation';

export function clearPendingCallView(): void {
	useCallStore.getState().resetNativeCallId();
	// If we're on CallView, navigate back
	Navigation.back();
}
