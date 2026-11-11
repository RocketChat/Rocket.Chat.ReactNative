import { getBasicAuthKey } from '~/lib/constants/keys';
import UserPreferences from '~/lib/methods/userPreferences';
import { store as reduxStore } from '~/lib/store/auxStore';
import { mockGlobalFetch } from '~/lib/testUtils/mockGlobalFetch';
import { editMediaMessage, setRoomsCategory } from '../restApi';

jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

const server = 'https://open.rocket.chat';

const jsonResponse = (status: number, body: unknown) =>
	({ ok: status < 400, status, statusText: 'Bad Request', json: () => Promise.resolve(body) }) as Response;

describe('authenticated REST posts', () => {
	const sentToNetwork = mockGlobalFetch(() => Promise.resolve(jsonResponse(200, { success: true })));

	beforeEach(() => {
		(reduxStore.getState as jest.Mock).mockReturnValue({
			server: { server },
			login: { user: { id: 'user-id', token: 'auth-token' } }
		});
	});

	it('posts the rooms category with the logged user credentials', async () => {
		await setRoomsCategory(['rid1', 'rid2'], 'category-id');

		const [url, options] = sentToNetwork.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe(`${server}/api/experimental/rooms.setCategory`);
		expect(options.method).toBe('POST');
		expect(options.headers).toEqual(
			expect.objectContaining({ 'Content-Type': 'application/json', 'X-Auth-Token': 'auth-token', 'X-User-Id': 'user-id' })
		);
		expect(JSON.parse(options.body as string)).toEqual({ roomIds: ['rid1', 'rid2'], category: 'category-id' });
	});

	it('sends the workspace Basic Auth credentials, so Basic Auth workspaces accept the request', async () => {
		UserPreferences.setString(getBasicAuthKey(server), 'credentials');

		await setRoomsCategory(['rid1'], 'category-id');

		UserPreferences.removeItem(getBasicAuthKey(server));
		const [, options] = sentToNetwork.mock.calls[0] as unknown as [string, RequestInit];
		expect(options.headers).toEqual(
			expect.objectContaining({ Authorization: 'Basic credentials', 'X-Auth-Token': 'auth-token' })
		);
	});

	it('throws the server error when the request fails', async () => {
		sentToNetwork.mockResolvedValueOnce(jsonResponse(400, { error: 'invalid-category' }));

		await expect(setRoomsCategory(['rid1'], 'missing')).rejects.toThrow('invalid-category');
	});

	it('throws the HTTP status when the failed response has no JSON body', async () => {
		sentToNetwork.mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error',
			json: () => Promise.reject(new SyntaxError('Unexpected token'))
		} as unknown as Response);

		await expect(setRoomsCategory(['rid1'], null)).rejects.toThrow('500 Internal Server Error');
	});

	it('returns the media confirm response body', async () => {
		sentToNetwork.mockResolvedValueOnce(jsonResponse(200, { message: { _id: 'message-id' } }));

		await expect(editMediaMessage('rid', 'file-id', { filename: 'photo.jpg' })).resolves.toEqual({
			message: { _id: 'message-id' }
		});
		const [url, options] = sentToNetwork.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe(`${server}/api/v1/rooms.mediaConfirm/rid/file-id`);
		expect(JSON.parse(options.body as string)).toEqual({ filename: 'photo.jpg', msg: '' });
	});

	it('prefixes media confirm failures with the edit context', async () => {
		sentToNetwork.mockResolvedValueOnce(jsonResponse(400, { error: 'file-not-found' }));

		await expect(editMediaMessage('rid', 'file-id', { filename: 'photo.jpg' })).rejects.toThrow(
			'Failed to edit media message: file-not-found'
		);
	});
});
