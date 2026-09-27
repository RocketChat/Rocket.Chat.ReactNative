import { Upload } from './Upload';
import { UploadHttpError } from './definitions';

class MockXHR {
	static instance: MockXHR;

	status = 0;
	statusText: string | undefined = undefined;
	responseText = '';
	headers: Record<string, string> = {};
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	onabort: (() => void) | null = null;
	upload = { onprogress: null as ((event: { loaded: number; total: number }) => void) | null };

	open = jest.fn();
	setRequestHeader = jest.fn();
	abort = jest.fn(() => this.onabort?.());
	getResponseHeader = jest.fn((name: string) => this.headers[name.toLowerCase()] ?? null);
	send = jest.fn(() => this.onload?.());

	constructor() {
		MockXHR.instance = this;
	}
}

beforeEach(() => {
	(global as any).XMLHttpRequest = MockXHR;
	(global as any).FormData = class {
		append = jest.fn();
	};
});

const send = ({
	status,
	responseText = '',
	headers = {}
}: {
	status: number;
	responseText?: string;
	headers?: Record<string, string>;
}) => {
	const upload = new Upload();
	upload.setupRequest('https://open.rocket.chat/api/v1/rooms.media/rid', {});
	const xhr = MockXHR.instance;
	xhr.status = status;
	xhr.responseText = responseText;
	xhr.headers = headers;
	return upload.send();
};

describe('Upload', () => {
	it('resolves the parsed body on success', async () => {
		await expect(send({ status: 200, responseText: '{"file":{"_id":"abc"}}' })).resolves.toEqual({ file: { _id: 'abc' } });
	});

	it('rejects a 413 with the status and the server message', async () => {
		await expect(send({ status: 413, responseText: '{"error":"File is too large"}' })).rejects.toMatchObject({
			name: 'UploadHttpError',
			status: 413,
			serverMessage: 'File is too large'
		});
	});

	it('rejects a 429 with the status', async () => {
		await expect(send({ status: 429, responseText: '{"error":"error-too-many-requests"}' })).rejects.toMatchObject({
			status: 429,
			serverMessage: 'error-too-many-requests'
		});
	});

	it('carries Retry-After from the response headers', async () => {
		await expect(send({ status: 429, headers: { 'retry-after': '37' } })).rejects.toMatchObject({
			status: 429,
			retryAfterSeconds: 37
		});
	});

	it('never rejects with "Error: undefined" when statusText is missing', async () => {
		const error = await send({ status: 413 }).catch(e => e);

		expect(MockXHR.instance.statusText).toBeUndefined();
		expect(error).toBeInstanceOf(UploadHttpError);
		expect(error.message).toBe('Error: 413');
		expect(error.message).not.toContain('undefined');
	});

	it('keeps a non-JSON body without inventing a server message', async () => {
		const error = await send({ status: 413, responseText: '<html>413 Request Entity Too Large</html>' }).catch(e => e);

		expect(error.status).toBe(413);
		expect(error.serverMessage).toBeUndefined();
		expect(error.body).toBe('<html>413 Request Entity Too Large</html>');
	});

	it('rejects with a network error', async () => {
		const upload = new Upload();
		upload.setupRequest('https://open.rocket.chat/api/v1/rooms.media/rid', {});
		MockXHR.instance.send = jest.fn(() => MockXHR.instance.onerror?.());

		await expect(upload.send()).rejects.toThrow('Network Error');
	});

	it('rejects with a cancellation once cancelled', async () => {
		const upload = new Upload();
		upload.setupRequest('https://open.rocket.chat/api/v1/rooms.media/rid', {});
		MockXHR.instance.send = jest.fn();
		const pending = upload.send();
		upload.cancel();

		await expect(pending).rejects.toThrow('Upload Cancelled');
	});
});
