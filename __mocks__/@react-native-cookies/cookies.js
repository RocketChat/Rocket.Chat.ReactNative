export default {
	set: jest.fn(() => Promise.resolve(true)),
	setFromResponse: jest.fn(() => Promise.resolve(true)),
	get: jest.fn(() => Promise.resolve({})),
	getFromResponse: jest.fn(() => Promise.resolve({})),
	getAll: jest.fn(() => Promise.resolve({})),
	clearAll: jest.fn(() => Promise.resolve(true)),
	clearByName: jest.fn(() => Promise.resolve(true)),
	removeSessionCookies: jest.fn(() => Promise.resolve(true)),
	flush: jest.fn(() => Promise.resolve())
};
