import { act, render } from '@testing-library/react-native';

import ScreenLockedView from '../ScreenLockedView';
import EventEmitter from '../../lib/methods/helpers/events';
import NativePrivacyCover from '../../lib/native/NativePrivacyCover';
import { LOCAL_AUTHENTICATE_EMITTER } from '../../lib/constants/localAuthentication';

jest.mock('react-native-modal', () => {
	const mockReact = require('react');
	const { View: MockView } = require('react-native');
	return ({ isVisible, children }: { isVisible: boolean; children: React.ReactNode }) =>
		isVisible ? mockReact.createElement(MockView, { testID: 'modal' }, children) : null;
});

const mockRenders: { finishProcess: () => void }[] = [];
jest.mock('../../containers/Passcode', () => ({
	PasscodeEnter: (props: { finishProcess: () => void }) => {
		mockRenders.push(props);
		return null;
	}
}));

const nativePrivacyCover = jest.mocked(NativePrivacyCover);

const emitLockRequest = () =>
	act(() => EventEmitter.emit(LOCAL_AUTHENTICATE_EMITTER, { submit: jest.fn(), cancel: jest.fn(), hasBiometry: false }));

describe('ScreenLockedView privacy cover', () => {
	beforeEach(() => {
		mockRenders.length = 0;
		jest.clearAllMocks();
		nativePrivacyCover.getCoverToken.mockReturnValue(7);
	});

	it('keeps the cover while a newly shown lock screen waits for the passcode', () => {
		render(<ScreenLockedView />);

		emitLockRequest();

		expect(nativePrivacyCover.releaseCover).not.toHaveBeenCalled();
	});

	it('releases the active trip cover as soon as the passcode is accepted', () => {
		render(<ScreenLockedView />);
		emitLockRequest();

		act(() => mockRenders[mockRenders.length - 1].finishProcess());

		expect(nativePrivacyCover.releaseCover).toHaveBeenCalledWith(7);
	});

	it('releases the active trip cover when a lock request arrives while the lock screen is already up', () => {
		render(<ScreenLockedView />);
		emitLockRequest();

		emitLockRequest();

		expect(nativePrivacyCover.releaseCover).toHaveBeenCalledWith(7);
	});
});
