jest.mock('../../navigation/appNavigation', () => ({
	__esModule: true,
	default: { navigate: jest.fn(), back: jest.fn() }
}));

jest.mock('../../../containers/ActionSheet', () => ({
	hideActionSheetRef: jest.fn()
}));

jest.mock('react-native-callkeep', () => ({}));

jest.mock('react-native-incall-manager', () => ({
	start: jest.fn(),
	stop: jest.fn(),
	setForceSpeakerphoneOn: jest.fn()
}));

import { useCallStore } from './useCallStore';

describe('useCallStore native pending', () => {
	beforeEach(() => {
		useCallStore.getState().clearNativePendingAccept();
		useCallStore.getState().reset();
	});

	it('reset preserves nativeAcceptedCallId', () => {
		useCallStore.getState().setNativePendingAccept('cid');
		useCallStore.getState().reset();
		const s = useCallStore.getState();
		expect(s.nativeAcceptedCallId).toBe('cid');
		expect(s.callId).toBeNull();
		expect(s.call).toBeNull();
	});

	it('clearNativePendingAccept clears sticky id and callId when unbound', () => {
		useCallStore.getState().setNativePendingAccept('cid');
		useCallStore.getState().clearNativePendingAccept();
		const s = useCallStore.getState();
		expect(s.nativeAcceptedCallId).toBeNull();
		expect(s.callId).toBeNull();
	});

	it('syncTransientCallIdFromNativePending sets callId from sticky after reset', () => {
		useCallStore.getState().setNativePendingAccept('cid');
		useCallStore.getState().reset();
		expect(useCallStore.getState().callId).toBeNull();
		useCallStore.getState().syncTransientCallIdFromNativePending();
		expect(useCallStore.getState().callId).toBe('cid');
	});

	it('setNativePendingAccept overwrites previous sticky id', () => {
		useCallStore.getState().setNativePendingAccept('a');
		useCallStore.getState().setNativePendingAccept('b');
		const s = useCallStore.getState();
		expect(s.nativeAcceptedCallId).toBe('b');
		expect(s.callId).toBe('b');
	});
});
