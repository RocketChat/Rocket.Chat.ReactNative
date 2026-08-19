import FileUpload, { MissingUploadAuthHeadersError } from './index';
import { Upload } from './Upload';

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
	])('refuses to build a request when %s', (_, headers) => {
		expect(() => new FileUpload('https://open.rocket.chat/api/v1/users.setAvatar', headers, formData)).toThrow(
			MissingUploadAuthHeadersError
		);
		expect(Upload).not.toHaveBeenCalled();
		expect(mockSetupRequest).not.toHaveBeenCalled();
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
