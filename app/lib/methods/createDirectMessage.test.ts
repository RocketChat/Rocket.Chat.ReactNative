import { createDirectMessage } from './createDirectMessage';
import { createDirectMessage as createDirectMessageRest } from '../services/restApi';
import { createDirectMessageSubscriptionStub } from './createDirectMessageSubscriptionStub';

jest.mock('../services/restApi', () => ({
	createDirectMessage: jest.fn()
}));

jest.mock('./createDirectMessageSubscriptionStub', () => ({
	createDirectMessageSubscriptionStub: jest.fn()
}));

const mockedRest = createDirectMessageRest as jest.Mock;
const mockedStub = createDirectMessageSubscriptionStub as jest.Mock;

describe('createDirectMessage wrapper', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedStub.mockResolvedValue(undefined);
	});

	it('calls stub with rid/username/fname on REST success and returns REST result', async () => {
		const restResult = { success: true, room: { _id: 'r1', fname: 'Foo' } };
		mockedRest.mockResolvedValue(restResult);

		const result = await createDirectMessage('foo');

		expect(mockedRest).toHaveBeenCalledWith('foo');
		expect(mockedStub).toHaveBeenCalledTimes(1);
		expect(mockedStub).toHaveBeenCalledWith({ rid: 'r1', username: 'foo', fname: 'Foo' });
		expect(result).toBe(restResult);
	});

	it('skips stub when REST success but room._id is missing', async () => {
		const restResult = { success: true, room: {} };
		mockedRest.mockResolvedValue(restResult);

		const result = await createDirectMessage('foo');

		expect(mockedRest).toHaveBeenCalledWith('foo');
		expect(mockedStub).not.toHaveBeenCalled();
		expect(result).toBe(restResult);
	});

	it('skips stub when REST returns success: false', async () => {
		const restResult = { success: false };
		mockedRest.mockResolvedValue(restResult);

		const result = await createDirectMessage('foo');

		expect(mockedRest).toHaveBeenCalledWith('foo');
		expect(mockedStub).not.toHaveBeenCalled();
		expect(result).toBe(restResult);
	});

	it('propagates REST errors without calling stub', async () => {
		const error = new Error('network error');
		mockedRest.mockRejectedValue(error);

		await expect(createDirectMessage('foo')).rejects.toThrow('network error');
		expect(mockedStub).not.toHaveBeenCalled();
	});

	it('propagates stub rejection (stub owns its own error handling)', async () => {
		const restResult = { success: true, room: { _id: 'r1', fname: 'Foo' } };
		mockedRest.mockResolvedValue(restResult);
		const stubError = new Error('stub write failed');
		mockedStub.mockRejectedValue(stubError);

		await expect(createDirectMessage('foo')).rejects.toThrow('stub write failed');
		expect(mockedRest).toHaveBeenCalledWith('foo');
		expect(mockedStub).toHaveBeenCalledTimes(1);
	});
});
