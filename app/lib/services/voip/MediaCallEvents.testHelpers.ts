/* eslint-env jest */
/** Shared jest factories used by MediaCallEvents.test.ts and MediaCallEvents.ios.test.ts. */
export const createConnectMock = () => ({
	checkAndReopen: jest.fn(() => Promise.resolve()),
	awaitDdpLoggedIn: jest.fn(() => Promise.resolve())
});

export const createSdkMock = () => ({
	__esModule: true,
	default: {
		current: {
			subscribeNotifyUser: jest.fn(() => Promise.resolve())
		}
	}
});
