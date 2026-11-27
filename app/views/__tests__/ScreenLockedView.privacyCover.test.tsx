import { act, render } from '@testing-library/react-native';

import ScreenLockedView from '../ScreenLockedView';
import EventEmitter from '../../lib/methods/helpers/events';
import NativePrivacyCover from '../../lib/native/NativePrivacyCover';
import { LOCAL_AUTHENTICATE_EMITTER } from '../../lib/constants/localAuthentication';

const mockHost: { onShown?: () => void } = {};
jest.mock('../../containers/LockScreenHost', () => ({
	LockScreenHost: ({ visible, onShown, children }: { visible: boolean; onShown: () => void; children: React.ReactNode }) => {
		mockHost.onShown = onShown;
		return visible ? children : null;
	}
}));

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

	it('keeps the cover when a second lock request arrives while the lock screen is still fading in', () => {
		render(<ScreenLockedView />);
		emitLockRequest();

		emitLockRequest();

		expect(nativePrivacyCover.releaseCover).not.toHaveBeenCalled();
	});

	it('releases the active trip cover once the lock screen has faded in after a second lock request', () => {
		render(<ScreenLockedView />);
		emitLockRequest();
		emitLockRequest();

		act(() => mockHost.onShown?.());

		expect(nativePrivacyCover.releaseCover).toHaveBeenCalledWith(7);
	});

	it('releases the active trip cover when a lock request arrives while the lock screen is already up', () => {
		render(<ScreenLockedView />);
		emitLockRequest();
		act(() => mockHost.onShown?.());

		emitLockRequest();

		expect(nativePrivacyCover.releaseCover).toHaveBeenCalledWith(7);
	});
});
