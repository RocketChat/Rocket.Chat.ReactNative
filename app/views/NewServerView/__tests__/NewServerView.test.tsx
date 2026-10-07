import { BackHandler } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import NewServerView from '..';
import { selectServerRequest } from '~/actions/server';
import { getServerById } from '~/lib/database/services/Server';
import { useAppSelector } from '~/lib/hooks/useAppSelector';

const PREVIOUS_SERVER = 'https://previous.example';
const PREVIOUS_VERSION = '7.0.0';

const mockDispatch = jest.fn();
const mockNavigation = { isFocused: jest.fn(), setOptions: jest.fn() };

jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNavigation }));
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: jest.fn() }));
jest.mock('~/lib/database/services/Server', () => ({ getServerById: jest.fn() }));
jest.mock('~/theme', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('~/containers/Button', () => () => null);
jest.mock('~/containers/FormContainer', () => ({
	__esModule: true,
	default: ({ children }: { children: unknown }) => children,
	FormContainerInner: ({ children }: { children: unknown }) => children
}));
jest.mock('~/containers/Header/components/HeaderButton', () => ({ CloseModal: () => null }));
jest.mock('~/views/NewServerView/components/ServerInput', () => () => null);
jest.mock('~/views/NewServerView/components/CertificatePicker', () => () => null);
jest.mock('~/views/NewServerView/hooks/useServersHistory', () => () => ({
	deleteServerHistory: jest.fn(),
	queryServerHistory: jest.fn(),
	serversHistory: []
}));
jest.mock('~/views/NewServerView/hooks/useCertificate', () => () => ({
	certificate: null,
	chooseCertificate: jest.fn(),
	removeCertificate: jest.fn(),
	autocompleteCertificate: jest.fn()
}));
jest.mock('~/views/NewServerView/hooks/useConnectServer', () => () => ({ submit: jest.fn() }));

const mockServerState = (state: { previousServer: string | null; connecting: boolean }) => {
	jest
		.mocked(useAppSelector)
		.mockImplementation(selector => selector({ server: { ...state, failureMessage: undefined } } as never));
};

const renderAndGetBackHandler = () => {
	const addEventListener = jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({ remove: jest.fn() });
	render(<NewServerView />);
	const registered = addEventListener.mock.calls.find(([eventName]) => eventName === 'hardwareBackPress');
	return registered![1] as () => boolean;
};

describe('NewServerView hardware back', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockNavigation.isFocused.mockReturnValue(true);
		jest.mocked(getServerById).mockResolvedValue({ version: PREVIOUS_VERSION } as never);
	});

	it('returns to the previous workspace when back is pressed outside of a connection check', async () => {
		mockServerState({ previousServer: PREVIOUS_SERVER, connecting: false });

		const handleBackPress = renderAndGetBackHandler();

		expect(handleBackPress()).toBe(true);
		await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith(selectServerRequest(PREVIOUS_SERVER, PREVIOUS_VERSION)));
	});

	it('swallows back without reselecting the previous workspace while the connection check is running', async () => {
		mockServerState({ previousServer: PREVIOUS_SERVER, connecting: true });

		const handleBackPress = renderAndGetBackHandler();

		expect(handleBackPress()).toBe(true);
		await Promise.resolve();
		expect(getServerById).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalledWith(selectServerRequest(PREVIOUS_SERVER, PREVIOUS_VERSION));
	});

	it('lets back through when there is no previous workspace, even while connecting', () => {
		mockServerState({ previousServer: null, connecting: true });

		const handleBackPress = renderAndGetBackHandler();

		expect(handleBackPress()).toBe(false);
	});

	it('lets back through when the screen is not focused', () => {
		mockServerState({ previousServer: PREVIOUS_SERVER, connecting: true });
		mockNavigation.isFocused.mockReturnValue(false);

		const handleBackPress = renderAndGetBackHandler();

		expect(handleBackPress()).toBe(false);
	});
});
