import { formatAttachmentUrl } from './formatAttachmentUrl';
import { store as reduxStore } from '../../store/auxStore';

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

const mockedGetState = reduxStore.getState as jest.Mock;

const SERVER = 'https://open.rocket.chat';
const USER_ID = 'userId';
const TOKEN = 'token';

const mockSettings = ({ protectFiles = false, cdnPrefix = '' } = {}) =>
	mockedGetState.mockReturnValue({ settings: { FileUpload_ProtectFiles: protectFiles, CDN_PREFIX: cdnPrefix } });

describe('formatAttachmentUrl', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// The server builds the path with `encodeURI(file.name)`, which encodes the spaces but leaves `#` raw — the url
	// would otherwise be cut at the fragment and the server would receive `/file-upload/1/a%20video%20`.
	describe('raw `#` in the filename', () => {
		const rawUrl = '/file-upload/1/a%20video%20#2.mov';
		const escapedUrl = `${SERVER}/file-upload/1/a%20video%20%232.mov`;

		test('escapes it on a relative url', () => {
			mockSettings();
			expect(formatAttachmentUrl(rawUrl, USER_ID, TOKEN, SERVER)).toBe(escapedUrl);
		});

		test('escapes it on an absolute url', () => {
			mockSettings();
			expect(formatAttachmentUrl(`${SERVER}${rawUrl}`, USER_ID, TOKEN, SERVER)).toBe(escapedUrl);
		});

		test('keeps the whole path when the auth params are appended', () => {
			mockSettings({ protectFiles: true });
			expect(formatAttachmentUrl(rawUrl, USER_ID, TOKEN, SERVER)).toBe(`${escapedUrl}?rc_token=${TOKEN}&rc_uid=${USER_ID}`);
		});

		// The `%20`s the server already applied must survive as-is — encoding them again would give `%2520`.
		test('escapes it without re-encoding the rest of the path', () => {
			mockSettings();
			expect(formatAttachmentUrl(`${SERVER}${rawUrl}?rc_token=${TOKEN}&rc_uid=${USER_ID}`, USER_ID, TOKEN, SERVER)).toBe(
				`${escapedUrl}?rc_token=${TOKEN}&rc_uid=${USER_ID}`
			);
		});

		test('escapes it behind a cdn prefix', () => {
			mockSettings({ cdnPrefix: 'https://cdn.example.com/' });
			expect(formatAttachmentUrl(rawUrl, USER_ID, TOKEN, SERVER)).toBe(
				'https://cdn.example.com/file-upload/1/a%20video%20%232.mov'
			);
		});
	});

	test('leaves an already-escaped `#` untouched', () => {
		mockSettings();
		expect(formatAttachmentUrl('/file-upload/1/a%20video%20%232.mov', USER_ID, TOKEN, SERVER)).toBe(
			`${SERVER}/file-upload/1/a%20video%20%232.mov`
		);
	});

	// An external url is not a file-upload path, so a `#` there can be a genuine fragment.
	test('returns an external original url verbatim', () => {
		mockSettings();
		const externalUrl = 'https://example.com/page#section';
		expect(formatAttachmentUrl(`${SERVER}/file-upload/1/file.mov`, USER_ID, TOKEN, SERVER, externalUrl)).toBe(externalUrl);
	});

	test('returns a base64 data uri untouched', () => {
		mockSettings();
		const base64 = 'data:image/png;base64,ABC123';
		expect(formatAttachmentUrl(base64, USER_ID, TOKEN, SERVER)).toBe(base64);
	});

	test('returns a local file uri untouched', () => {
		mockSettings();
		const fileUri = 'file:///var/app/Documents/server/msg1/video.mov';
		expect(formatAttachmentUrl(fileUri, USER_ID, TOKEN, SERVER)).toBe(fileUri);
	});
});
