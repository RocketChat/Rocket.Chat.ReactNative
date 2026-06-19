import { type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { mockedStore } from '../../reducers/mockedStore';
import { setActiveUsers } from '../../actions/activeUsers';
import { connectSuccess, connectRequest, disconnect } from '../../actions/connect';
import { initStore } from '../../lib/store/auxStore';
import { selectServerSuccess } from '../../actions/server';
import RoomHeaderContainer from './index';

const mockChild = jest.fn<any, [Record<string, unknown>]>(() => null);
jest.mock('./RoomHeader', () => ({
	__esModule: true,
	default: (props: Record<string, unknown>) => {
		mockChild(props);
		return null;
	}
}));

const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const defaultProps = {
	title: 'John Doe',
	type: 'd',
	roomUserId: 'user-123',
	onPress: jest.fn()
};

const renderContainer = (props: Record<string, unknown> = {}) =>
	render(<RoomHeaderContainer {...defaultProps} {...props} />, { wrapper: Wrapper });

describe('RoomHeaderContainer', () => {
	beforeAll(() => {
		initStore(mockedStore);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockedStore.dispatch(disconnect());
	});

	const connect = () => {
		mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));
		mockedStore.dispatch(connectSuccess());
	};

	it('should pass subtitle as Connecting when meteor is connecting for non-DM room', () => {
		mockedStore.dispatch(connectRequest());
		mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));

		renderContainer({ type: 'c', roomUserId: undefined });

		const props = mockChild.mock.calls[0][0];
		expect(props.subtitle).toBe('Connecting...');
	});

	it('should pass subtitle as Waiting for network... when not connected for non-DM room', () => {
		mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));

		renderContainer({ type: 'c', roomUserId: undefined });

		const props = mockChild.mock.calls[0][0];
		expect(props.subtitle).toBe('Waiting for network...');
	});

	it('should pass presence status for DM room when connected and activeUser exists', () => {
		connect();
		mockedStore.dispatch(
			setActiveUsers({ 'user-123': { status: 'online', statusText: 'Working from home', statusExpiresAt: undefined } })
		);

		renderContainer();

		const props = mockChild.mock.calls[0][0];
		expect(props.subtitle).toBe('Working from home');
		expect(props.type).toBe('d');
	});

	it('should pass statusExpiresAt for DM room when activeUser has it', () => {
		connect();
		mockedStore.dispatch(
			setActiveUsers({
				'user-123': { status: 'away', statusText: 'In a meeting', statusExpiresAt: '2026-06-20T13:00:00.000Z' }
			})
		);

		renderContainer();

		const props = mockChild.mock.calls[0][0];
		expect(props.subtitle).toBe('In a meeting');
		expect(props.statusExpiresAt).toBe('2026-06-20T13:00:00.000Z');
	});

	it('should use presence label when statusText is empty', () => {
		connect();
		mockedStore.dispatch(setActiveUsers({ 'user-123': { status: 'busy', statusText: '', statusExpiresAt: undefined } }));

		renderContainer();

		const props = mockChild.mock.calls[0][0];
		expect(props.subtitle).toBe('Busy');
	});

	it('should not pass statusExpiresAt for non-DM room', () => {
		connect();
		mockedStore.dispatch(
			setActiveUsers({ 'user-123': { status: 'away', statusText: 'Away', statusExpiresAt: '2026-06-20T13:00:00.000Z' } })
		);

		renderContainer({ type: 'c', roomUserId: undefined });

		const props = mockChild.mock.calls[0][0];
		expect(props.statusExpiresAt).toBeUndefined();
	});

	it('should pass subtitleProp when connected and no activeUser', () => {
		connect();

		renderContainer({ subtitle: 'Custom subtitle', roomUserId: undefined, type: 'c' });

		const props = mockChild.mock.calls[0][0];
		expect(props.subtitle).toBe('Custom subtitle');
	});

	it('should pass roomUserId to RoomHeader', () => {
		connect();

		renderContainer();

		const props = mockChild.mock.calls[0][0];
		expect(props.roomUserId).toBe('user-123');
	});
});
