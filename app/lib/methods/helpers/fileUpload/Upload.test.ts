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
});
