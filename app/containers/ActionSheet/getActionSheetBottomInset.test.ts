import { Platform } from 'react-native';
import { type EdgeInsets } from 'react-native-safe-area-context';

import { getActionSheetBottomInset } from './getActionSheetBottomInset';

// isAndroid/isIOS are derived from Platform.OS at import time, so drive them via a mutable mock.
jest.mock('../../lib/methods/helpers', () => ({ isAndroid: true, isIOS: false }));

// initialWindowMetrics holds the window insets captured natively at launch.
jest.mock('react-native-safe-area-context', () => ({ initialWindowMetrics: { insets: { bottom: 48 } } }));

const helpers = jest.requireMock('../../lib/methods/helpers') as { isAndroid: boolean; isIOS: boolean };
const safeArea = jest.requireMock('react-native-safe-area-context') as {
	initialWindowMetrics: { insets: { bottom: number } } | null;
};

const insets = (bottom: number): EdgeInsets => ({ top: 0, bottom, left: 0, right: 0 });

// Platform.Version is not writable in the RN jest preset, so drive it through a getter.
let mockVersion: number = 34;
Object.defineProperty(Platform, 'Version', { configurable: true, get: () => mockVersion });

describe('getActionSheetBottomInset', () => {
	afterEach(() => {
		mockVersion = 34;
		helpers.isAndroid = true;
		helpers.isIOS = false;
		safeArea.initialWindowMetrics = { insets: { bottom: 48 } };
	});

	it('reserves the captured nav bar height on older Android when live insets are 0 (the Samsung S24 Ultra bug)', () => {
		safeArea.initialWindowMetrics = { insets: { bottom: 48 } };

		// live insets are 0 because the app is not edge-to-edge; fall back to the captured nav bar (48)
		expect(getActionSheetBottomInset(insets(0))).toBe(48);
	});

	it('prefers the larger of live and captured insets', () => {
		safeArea.initialWindowMetrics = { insets: { bottom: 24 } };

		// max(live 48, captured 24)
		expect(getActionSheetBottomInset(insets(48))).toBe(48);
	});

	it('returns 0 when no captured metrics are available and live insets are 0', () => {
		safeArea.initialWindowMetrics = null;

		expect(getActionSheetBottomInset(insets(0))).toBe(0);
	});

	it('returns 0 on edge-to-edge Android (SDK >= 36) where the native sheet reserves the inset', () => {
		mockVersion = 36;

		expect(getActionSheetBottomInset(insets(0))).toBe(0);
	});

	it('returns 0 on iOS', () => {
		helpers.isAndroid = false;
		helpers.isIOS = true;

		expect(getActionSheetBottomInset(insets(34))).toBe(0);
	});
});
