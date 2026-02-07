export default {
	setup: jest.fn(),
	canMakeMultipleCalls: jest.fn(),
	displayIncomingCall: jest.fn(),
	endCall: jest.fn(),
	setCurrentCallActive: jest.fn(),
	addEventListener: jest.fn((event, callback) => ({
		remove: jest.fn()
	}))
};
