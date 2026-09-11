import { act, render } from '@testing-library/react-native';

import ScreenLockedView from './ScreenLockedView';
import EventEmitter from '../lib/methods/helpers/events';
import { LOCAL_AUTHENTICATE_EMITTER } from '../lib/constants/localAuthentication';

// Renders children only while visible, so the assertions read the modal's real visibility.
jest.mock('react-native-modal', () => {
	const mockReact = require('react');
	const { View: MockView } = require('react-native');
	return ({ isVisible, children }: { isVisible: boolean; children: React.ReactNode }) =>
		isVisible ? mockReact.createElement(MockView, { testID: 'modal' }, children) : null;
});

// Captures the callbacks each render hands down; index 0 is the ones the first request mounted with.
const mockRenders: { finishProcess: () => void }[] = [];
jest.mock('../containers/Passcode', () => ({
	PasscodeEnter: (props: { finishProcess: () => void }) => {
		mockRenders.push(props);
		return null;
	}
}));

type TLockRequest = { submit: jest.Mock; cancel: jest.Mock; hasBiometry: boolean };

const emit = (payload: TLockRequest) => act(() => EventEmitter.emit(LOCAL_AUTHENTICATE_EMITTER, payload));

describe('ScreenLockedView supersession', () => {
	beforeEach(() => {
		mockRenders.length = 0;
	});

	it('a superseded request completing late settles nothing and leaves its replacement up', () => {
		const first = { submit: jest.fn(), cancel: jest.fn(), hasBiometry: true };
		const second = { submit: jest.fn(), cancel: jest.fn(), hasBiometry: false };
		const { queryByTestId } = render(<ScreenLockedView />);

		emit(first);
		const staleFinishProcess = mockRenders[0].finishProcess;

		// Supersession rejects the first request; the replacement is what the user now sees.
		emit(second);
		expect(first.cancel).toHaveBeenCalledTimes(1);
		expect(queryByTestId('modal')).not.toBeNull();

		// The first request's biometric prompt resolves after all of that, calling the finishProcess
		// its PasscodeEnter mounted with.
		act(() => staleFinishProcess());

		expect(first.submit).not.toHaveBeenCalled();
		expect(second.submit).not.toHaveBeenCalled();
		expect(second.cancel).not.toHaveBeenCalled();
		expect(queryByTestId('modal')).not.toBeNull();
	});

	it('the current request completing still hides the modal', () => {
		const request = { submit: jest.fn(), cancel: jest.fn(), hasBiometry: true };
		const { queryByTestId } = render(<ScreenLockedView />);

		emit(request);
		act(() => mockRenders[mockRenders.length - 1].finishProcess());

		expect(queryByTestId('modal')).toBeNull();
	});
});
