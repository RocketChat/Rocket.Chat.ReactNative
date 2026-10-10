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
		getParts = jest.fn(() => []);
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

	it('rejects when a 2xx response has no parseable body', async () => {
		await expect(send({ status: 200, responseText: 'not json' })).rejects.toThrow('Upload failed: invalid server response');
	});

	it('rejects a 3xx as an HTTP error instead of treating it as success', async () => {
		const error = await send({ status: 302, responseText: '<html>Found</html>' }).catch(e => e);

		expect(error).toBeInstanceOf(UploadHttpError);
		expect(error.status).toBe(302);
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

const RealFormData = jest.requireActual('react-native/Libraries/Network/FormData').default;

const getDisposition = (filename: string) => {
	const upload = new Upload();
	upload.appendFile({ name: 'file', uri: 'file:///cache/a.pdf', type: 'application/pdf', filename });
	return (upload as any).formData.getParts()[0].headers['content-disposition'];
};

describe('Upload multipart filename', () => {
	beforeEach(() => {
		(global as any).FormData = RealFormData;
	});

	it('keeps a Cyrillic filename as raw UTF-8 instead of percent-encoding it', () => {
		expect(getDisposition('Пример.pdf')).toBe('form-data; name="file"; filename="Пример.pdf"');
	});

	it('replaces path separators and line breaks with underscores', () => {
		expect(getDisposition('a/b\r\nc.pdf')).toBe('form-data; name="file"; filename="a_b__c.pdf"');
	});

	it('escapes double quotes so the header cannot be broken out of', () => {
		expect(getDisposition('a"b.pdf')).toBe('form-data; name="file"; filename="a%22b.pdf"');
	});

	it('leaves string fields without a filename untouched', () => {
		const upload = new Upload();
		upload.appendFile({ name: 'description', data: 'hello' });
		expect((upload as any).formData.getParts()[0].headers['content-disposition']).toBe('form-data; name="description"');
	});

	it('keeps the uri, type and field name of the file part', () => {
		const upload = new Upload();
		upload.appendFile({ name: 'file', uri: 'file:///cache/a.pdf', type: 'application/pdf', filename: 'Пример.pdf' });
		const [part] = (upload as any).formData.getParts();
		expect(part).toMatchObject({ uri: 'file:///cache/a.pdf', type: 'application/pdf', fieldName: 'file', name: 'Пример.pdf' });
		expect(part.headers['content-type']).toBe('application/pdf');
	});

	it('rewrites only the file part when the form also has string fields', () => {
		const upload = new Upload();
		upload.appendFile({ name: 'file', uri: 'file:///cache/a.pdf', type: 'application/pdf', filename: 'Пример.pdf' });
		upload.appendFile({ name: 'description', data: 'Описание' });
		const parts = (upload as any).formData.getParts();
		expect(parts[0].headers['content-disposition']).toBe('form-data; name="file"; filename="Пример.pdf"');
		expect(parts[1].headers['content-disposition']).toBe('form-data; name="description"');
		expect(parts[1].string).toBe('Описание');
	});

	it('does not double-encode a name that already contains a percent sign', () => {
		expect(getDisposition('100%.pdf')).toBe('form-data; name="file"; filename="100%.pdf"');
	});
});
