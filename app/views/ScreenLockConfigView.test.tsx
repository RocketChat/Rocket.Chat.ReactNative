import * as localAuthentication from '../lib/methods/helpers/localAuthentication';
import { ScreenLockConfigView } from './ScreenLockConfigView';

// Mock localAuthentication helpers used by the component
jest.mock('../lib/methods/helpers/localAuthentication', () => ({
	handleLocalAuthentication: jest.fn(),
	changePasscode: jest.fn(),
	checkHasPasscode: jest.fn(),
	supportedBiometryLabel: jest.fn()
}));

// Mock the database to avoid hitting real DB in constructor.init()
jest.mock('../lib/database', () => ({
	servers: {
		get: jest.fn(() => ({
			find: jest.fn(() => ({ autoLock: true, autoLockTime: null }))
		}))
	}
}));

// Mock i18n to avoid initialization side-effects in tests
jest.mock('../i18n', () => ({ 
	__esModule: true,
	default: { t: jest.fn((k: string) => k) } 
}));

describe('ScreenLockConfigView - integration tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('should add 300ms delay between authentication and passcode change (real component)', async () => {
		const handleLocalAuthenticationMock = (localAuthentication.handleLocalAuthentication as jest.Mock).mockResolvedValue(undefined);
		const changePasscodeMock = (localAuthentication.changePasscode as jest.Mock).mockResolvedValue(undefined);

		// Create a mock instance of the component
		const mockInstance: any = new (ScreenLockConfigView as any)({ theme: 'light', server: '', Force_Screen_Lock: false, Force_Screen_Lock_After: 0 });
		
		// Set the state we want for this test
		mockInstance.state = { autoLock: true };

		const promise = mockInstance.changePasscode({ force: false });

		// microtask flush so the handleLocalAuthentication call happens
		await Promise.resolve();
		expect(handleLocalAuthenticationMock).toHaveBeenCalledWith(true);

		// changePasscode should NOT be called before the delay
		expect(changePasscodeMock).not.toHaveBeenCalled();

		// advance timers and flush all promises
		jest.runAllTimers();
		await promise;

		expect(changePasscodeMock).toHaveBeenCalledWith({ force: false });
	});

	it('should return early when authentication is cancelled (real component)', async () => {
		const handleLocalAuthenticationMock = (localAuthentication.handleLocalAuthentication as jest.Mock).mockRejectedValue(new Error('cancel'));
		const changePasscodeMock = (localAuthentication.changePasscode as jest.Mock).mockResolvedValue(undefined);

		const mockInstance: any = new (ScreenLockConfigView as any)({ theme: 'light', server: '', Force_Screen_Lock: false, Force_Screen_Lock_After: 0 });
		mockInstance.state = { autoLock: true };

		await mockInstance.changePasscode({ force: false });		expect(handleLocalAuthenticationMock).toHaveBeenCalledWith(true);
		expect(changePasscodeMock).not.toHaveBeenCalled();
	});

	it('should proceed directly to passcode change when autoLock is disabled (real component)', async () => {
		const handleLocalAuthenticationMock = (localAuthentication.handleLocalAuthentication as jest.Mock);
		const changePasscodeMock = (localAuthentication.changePasscode as jest.Mock).mockResolvedValue(undefined);

		const mockInstance: any = new (ScreenLockConfigView as any)({ theme: 'light', server: '', Force_Screen_Lock: false, Force_Screen_Lock_After: 0 });
		mockInstance.state = { autoLock: false };

		await mockInstance.changePasscode({ force: false });		expect(handleLocalAuthenticationMock).not.toHaveBeenCalled();
		expect(changePasscodeMock).toHaveBeenCalledWith({ force: false });
	});
});

