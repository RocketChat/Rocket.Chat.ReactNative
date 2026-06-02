import EventEmitter from './events';
import { handleLocalAuthentication } from './localAuthentication';
import { biometricTrustStore } from '../../biometricTrustStore';
import { LOCAL_AUTHENTICATE_EMITTER } from '../../constants/localAuthentication';

jest.mock('expo-local-authentication', () => ({
	authenticateAsync: jest.fn(),
	isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
	supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([2])),
	AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 }
}));

jest.mock('react-native-bootsplash', () => ({ hide: jest.fn(() => Promise.resolve()) }));

jest.mock('../userPreferences', () => ({
	__esModule: true,
	default: {
		getBool: jest.fn(),
		setBool: jest.fn(),
		getString: jest.fn(),
		setString: jest.fn()
	}
}));

jest.mock('../../store/auxStore', () => ({ store: { dispatch: jest.fn() } }));
jest.mock('../../services/getServerTimeSync', () => ({ getServerTimeSync: jest.fn(() => Promise.resolve(Date.now())) }));
jest.mock('../../../i18n', () => ({ t: (key: string) => key }));

jest.mock('../../biometricTrustStore', () => ({
	biometricTrustStore: {
		verify: jest.fn(),
		enrol: jest.fn(),
		disenrol: jest.fn(),
		probeExists: jest.fn(),
		isEnabled: jest.fn(),
		setEnabled: jest.fn()
	}
}));

jest.mock('./events', () => ({
	__esModule: true,
	default: { emit: jest.fn(), addEventListener: jest.fn(), removeListener: jest.fn() }
}));

const mockedEmit = EventEmitter.emit as jest.Mock;
const mockedVerify = biometricTrustStore.verify as jest.Mock;
const mockedDisenrol = biometricTrustStore.disenrol as jest.Mock;
const mockedIsEnabled = biometricTrustStore.isEnabled as jest.Mock;
const mockedSetEnabled = biometricTrustStore.setEnabled as jest.Mock;

const lastEmitPayload = () => {
	const calls = mockedEmit.mock.calls.filter(([event]) => event === LOCAL_AUTHENTICATE_EMITTER);
	return calls.length ? calls[calls.length - 1][1] : null;
};

describe('handleLocalAuthentication (Option C)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedDisenrol.mockResolvedValue(undefined);
		mockedEmit.mockImplementation((event, payload) => {
			if (event === LOCAL_AUTHENTICATE_EMITTER && payload?.submit) {
				setImmediate(() => payload.submit());
			}
		});
	});

	it('biometry disabled → opens modal with hasBiometry: false (no verify call)', async () => {
		mockedIsEnabled.mockReturnValue(false);

		await handleLocalAuthentication();

		const payload = lastEmitPayload();
		expect(payload).toMatchObject({ hasBiometry: false });
		expect(payload.skipAutoBiometry).toBeFalsy();
		expect(mockedVerify).not.toHaveBeenCalled();
	});

	it('verify success → does NOT open passcode modal, no invalidation', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedVerify.mockResolvedValueOnce({ kind: 'success' });

		await handleLocalAuthentication();

		expect(mockedEmit).not.toHaveBeenCalledWith(LOCAL_AUTHENTICATE_EMITTER, expect.anything());
		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('verify canceled → flag untouched, modal with hasBiometry: true and skipAutoBiometry: true', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedVerify.mockResolvedValueOnce({ kind: 'canceled' });

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: true, skipAutoBiometry: true });
		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('verify error → flag untouched, modal with hasBiometry: true and skipAutoBiometry: true', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedVerify.mockResolvedValueOnce({ kind: 'error', cause: new Error('boom') });

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: true, skipAutoBiometry: true });
		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('verify unavailable → opens modal with hasBiometry: false', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedVerify.mockResolvedValueOnce({ kind: 'unavailable' });

		await handleLocalAuthentication();

		const payload = lastEmitPayload();
		expect(payload).toMatchObject({ hasBiometry: false });
		expect(payload.skipAutoBiometry).toBeFalsy();
	});

	it('verify enrollmentChanged → disenrol() before flag clear before modal emit', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedVerify.mockResolvedValueOnce({ kind: 'enrollmentChanged' });

		const order: string[] = [];
		mockedDisenrol.mockImplementationOnce(() => {
			order.push('disenrol');
			return Promise.resolve();
		});
		mockedSetEnabled.mockImplementationOnce((value: boolean) => {
			order.push(`setEnabled:${value}`);
		});
		mockedEmit.mockImplementation((event, payload) => {
			if (event === LOCAL_AUTHENTICATE_EMITTER) {
				order.push('emit');
				if (payload?.submit) {
					setImmediate(() => payload.submit());
				}
			}
		});

		await handleLocalAuthentication();

		expect(order).toEqual(['disenrol', 'setEnabled:false', 'emit']);
		const payload = lastEmitPayload();
		expect(payload).toMatchObject({ hasBiometry: false, reason: 'enrollmentChanged' });
		expect(payload.skipAutoBiometry).toBeFalsy();
	});
});
