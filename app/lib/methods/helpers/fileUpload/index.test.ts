import FileUpload, { MissingUploadAuthHeadersError } from './index';

const mockSetupRequest = jest.fn();
const mockAppendFile = jest.fn();
const mockSend = jest.fn(() => Promise.resolve({ success: true }));
const mockCancel = jest.fn();

jest.mock('./Upload', () => ({
	Upload: jest.fn().mockImplementation(() => ({
		setupRequest: mockSetupRequest,
		appendFile: mockAppendFile,
		send: mockSend,
		cancel: mockCancel
	}))
}));

const formData = [{ name: 'file', uri: 'file://image.jpg', type: 'image/jpeg', filename: 'image.jpg' }];

describe('FileUpload', () => {
	beforeEach(() => jest.clearAllMocks());

	it.each([
		['both auth headers missing', { 'Content-Type': 'multipart/form-data' }],
		['token missing', { 'X-Auth-Token': undefined, 'X-User-Id': 'user-id' }],
		['user id missing', { 'X-Auth-Token': 'token', 'X-User-Id': undefined }],
		['token empty', { 'X-Auth-Token': '', 'X-User-Id': 'user-id' }]
	])('refuses to send when %s', async (_, headers) => {
		const upload = new FileUpload('https://open.rocket.chat/api/v1/users.setAvatar', headers, formData);

		await expect(upload.send()).rejects.toThrow(MissingUploadAuthHeadersError);
		expect(mockSend).not.toHaveBeenCalled();
	});

	it('carries a translation key for the UI and a developer message', async () => {
		const upload = new FileUpload('https://open.rocket.chat/api/v1/users.setAvatar', {}, formData);

		await expect(upload.send()).rejects.toMatchObject({
			error: 'Token_expired',
			message: 'Upload requires the X-Auth-Token and X-User-Id headers'
		});
	});

	it('sends an authenticated upload keeping optional headers out of the request', async () => {
		const progressCallback = jest.fn();
		const upload = new FileUpload(
			'https://open.rocket.chat/api/v1/rooms.media/rid',
			{
				'Content-Type': 'multipart/form-data',
				'X-Auth-Token': 'token',
				'X-User-Id': 'user-id',
				'X-Optional': undefined
			},
			formData,
			progressCallback
		);

		expect(mockSetupRequest).toHaveBeenCalledWith(
			'https://open.rocket.chat/api/v1/rooms.media/rid',
			{
				'Content-Type': 'multipart/form-data',
				'X-Auth-Token': 'token',
				'X-User-Id': 'user-id'
			},
			progressCallback
		);
		expect(mockAppendFile).toHaveBeenCalledWith(formData[0]);

		await expect(upload.send()).resolves.toEqual({ success: true });

		upload.cancel();
		expect(mockCancel).toHaveBeenCalledTimes(1);
	});
});
