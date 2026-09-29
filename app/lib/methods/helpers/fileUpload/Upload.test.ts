import { Upload } from './Upload';

beforeAll(() => {
	global.XMLHttpRequest = jest.fn() as any;
	global.FormData = jest.requireActual('react-native/Libraries/Network/FormData').default;
});

const getDisposition = (filename: string) => {
	const upload = new Upload();
	upload.appendFile({ name: 'file', uri: 'file:///cache/a.pdf', type: 'application/pdf', filename });
	return (upload as any).formData.getParts()[0].headers['content-disposition'];
};

describe('Upload multipart filename', () => {
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
