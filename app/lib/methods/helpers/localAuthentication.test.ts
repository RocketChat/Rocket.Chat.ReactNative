import EventEmitter from './events';
import { handleLocalAuthentication } from './localAuthentication';
import UserPreferences from '../userPreferences';
import { biometricTrustStore } from '../../biometricTrustStore';
import { LOCAL_AUTHENTICATE_EMITTER, BIOMETRY_ENABLED_KEY } from '../../constants/localAuthentication';

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
		probeExists: jest.fn()
	}
}));

jest.mock('./events', () => ({
	__esModule: true,
	default: { emit: jest.fn(), addEventListener: jest.fn(), removeListener: jest.fn() }
}));

const mockedEmit = EventEmitter.emit as jest.Mock;
const mockedGetBool = UserPreferences.getBool as jest.Mock;
const mockedSetBool = UserPreferences.setBool as jest.Mock;
const mockedVerify = biometricTrustStore.verify as jest.Mock;
const mockedDisenrol = biometricTrustStore.disenrol as jest.Mock;

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
		mockedGetBool.mockImplementation((key: string) => (key === BIOMETRY_ENABLED_KEY ? false : undefined));

		await handleLocalAuthentication();

		const payload = lastEmitPayload();
		expect(payload).toMatchObject({ hasBiometry: false });
		expect(payload.skipAutoBiometry).toBeFalsy();
		expect(mockedVerify).not.toHaveBeenCalled();
	});

	it('verify success → does NOT open passcode modal, no invalidation', async () => {
		mockedGetBool.mockImplementation((key: string) => (key === BIOMETRY_ENABLED_KEY ? true : undefined));
		mockedVerify.mockResolvedValueOnce({ kind: 'success' });

		await handleLocalAuthentication();

		expect(mockedEmit).not.toHaveBeenCalledWith(LOCAL_AUTHENTICATE_EMITTER, expect.anything());
		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
	});

	it('verify canceled → flag untouched, modal with hasBiometry: true and skipAutoBiometry: true', async () => {
		mockedGetBool.mockImplementation((key: string) => (key === BIOMETRY_ENABLED_KEY ? true : undefined));
		mockedVerify.mockResolvedValueOnce({ kind: 'canceled' });

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: true, skipAutoBiometry: true });
		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
	});

	it('verify error → flag untouched, modal with hasBiometry: true and skipAutoBiometry: true', async () => {
		mockedGetBool.mockImplementation((key: string) => (key === BIOMETRY_ENABLED_KEY ? true : undefined));
		mockedVerify.mockResolvedValueOnce({ kind: 'error', cause: new Error('boom') });

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: true, skipAutoBiometry: true });
		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
	});

	it('verify unavailable → opens modal with hasBiometry: false', async () => {
		mockedGetBool.mockImplementation((key: string) => (key === BIOMETRY_ENABLED_KEY ? true : undefined));
		mockedVerify.mockResolvedValueOnce({ kind: 'unavailable' });

		await handleLocalAuthentication();

		const payload = lastEmitPayload();
		expect(payload).toMatchObject({ hasBiometry: false });
		expect(payload.skipAutoBiometry).toBeFalsy();
	});

	it('verify enrollmentChanged → disenrol() before flag clear before modal emit', async () => {
		mockedGetBool.mockImplementation((key: string) => (key === BIOMETRY_ENABLED_KEY ? true : undefined));
		mockedVerify.mockResolvedValueOnce({ kind: 'enrollmentChanged' });

		const order: string[] = [];
		mockedDisenrol.mockImplementationOnce(() => {
			order.push('disenrol');
			return Promise.resolve();
		});
		mockedSetBool.mockImplementationOnce((key: string, value: boolean) => {
			order.push(`setBool:${key}=${value}`);
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

		expect(order).toEqual(['disenrol', `setBool:${BIOMETRY_ENABLED_KEY}=false`, 'emit']);
		const payload = lastEmitPayload();
		expect(payload).toMatchObject({ hasBiometry: false, reason: 'enrollmentChanged' });
		expect(payload.skipAutoBiometry).toBeFalsy();
	});
});
