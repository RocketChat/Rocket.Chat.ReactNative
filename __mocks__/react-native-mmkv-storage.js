export class MMKVLoader {
	constructor() {
		console.log('MMKVLoader constructor mock');
	}

	setProcessingMode = jest.fn().mockImplementation(() => ({
		withEncryption: jest.fn().mockImplementation(() => ({
			encryptWithCustomKey: jest.fn().mockImplementation(() => ({ initialize: jest.fn().mockImplementation(() => {}) }))
		}))
	}));
}

export const ProcessingModes = {
	MULTI_PROCESS: ''
};

export const create = jest.fn();
