/**
 * CallNavRouter — subscribes to CallLifecycle events and handles call navigation.
 *
 * Subscribes ONLY after the NavigationContainer is ready (listens for the
 * `navigationReady` emitter event fired from AppContainer.tsx onReady).
 *
 * On `callBegan`: navigates to `CallView`.
 * On `callEnded`: if the current route is `CallView`, calls `Navigation.back()`.
 *
 * Mount point: AppContainer.tsx (after NavigationContainer renders).
 */

import Navigation from '../../navigation/appNavigation';
import { emitter } from '../../methods/helpers';
import { callLifecycle } from './CallLifecycle';

let _unsubscribeCallEnded: (() => void) | null = null;
let _unsubscribeCallBegan: (() => void) | null = null;
let _mounted = false;

/**
 * Mount the router. Should be called once from AppContainer (or equivalent).
 * Safe to call multiple times — subsequent calls are no-ops.
 */
function mount(): void {
	if (_mounted) return;
	_mounted = true;

	// Wait for NavigationContainer to be ready before subscribing.
	// The `navigationReady` event is emitted from AppContainer.tsx onReady().
	function onNavigationReady(): void {
		// Unsubscribe previous listeners if somehow re-mounted.
		_unsubscribeCallEnded?.();
		_unsubscribeCallBegan?.();

		_unsubscribeCallBegan = callLifecycle.emitter.on('callBegan', () => {
			Navigation.navigate('CallView');
		});

		_unsubscribeCallEnded = callLifecycle.emitter.on('callEnded', () => {
			const currentRoute = Navigation.getCurrentRoute();
			if (currentRoute?.name === 'CallView') {
				Navigation.back();
			}
		});
	}

	// If navigation is already ready (e.g., hot-reload), subscribe immediately.
	if (Navigation.navigationRef.current) {
		onNavigationReady();
	} else {
		// mitt does not have `once`; implement it manually.
		const onceNavigationReady = () => {
			emitter.off('navigationReady', onceNavigationReady);
			onNavigationReady();
		};
		emitter.on('navigationReady', onceNavigationReady);
	}
}

/**
 * Unmount the router. Cleans up event listeners.
 * Useful for testing or if the router needs to be reset.
 */
function unmount(): void {
	_unsubscribeCallEnded?.();
	_unsubscribeCallEnded = null;
	_unsubscribeCallBegan?.();
	_unsubscribeCallBegan = null;
	_mounted = false;
}

export const CallNavRouter = { mount, unmount };
