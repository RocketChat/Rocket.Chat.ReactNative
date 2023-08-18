export class MMKVLoader {
	constructor() {
		console.log('MMKVLoader constructor mock');
	}

	setProcessingMode = jest.fn().mockImplementation(() => ({
		setAccessibleIOS: jest.fn().mockImplementation(() => ({
			withEncryption: jest.fn().mockImplementation(() => ({
				initialize: jest.fn().mockImplementation(() => {})
			}))
		}))
	}));
}

export const ProcessingModes = {
	MULTI_PROCESS: ''
};

export const IOSAccessibleStates = {
	AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: ''
};

export const create = jest.fn();
