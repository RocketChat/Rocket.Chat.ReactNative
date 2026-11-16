import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { sendFileMessageV2 } from '../sendFileMessageV2';
import { Encryption } from '../../../encryption';
import fetch from '../../helpers/fetch';
import { type IFormData } from '../../helpers/fileUpload/definitions';
import { type TAppDatabase } from '../../../database/interfaces';
import { type IMessage, type TSendFileMessageFileInfo } from '~/definitions';
import { createInMemoryAppDatabase } from '../../../testUtils/inMemoryDatabase';
import { webClientDecryptFile, webClientDecryptText } from '../../../testUtils/e2eeWebClient';
import roomKeys from '../../../encryption/__tests__/fixtures/roomKeys.json';
import user from '../../../encryption/__tests__/fixtures/user.json';

jest.unmock('../../../encryption');

let mockDatabase: TAppDatabase;
jest.mock('../../../database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockDatabase;
		}
	}
}));

jest.mock('../../../services/sdk', () => ({
	__esModule: true,
	default: { post: jest.fn(), get: jest.fn(), methodCallWrapper: jest.fn() }
}));

jest.mock('../../../store/auxStore', () => ({
	store: {
		getState: () => ({
			server: { version: '7.13.0' },
			settings: { E2E_Enable: true },
			encryption: { enabled: true, banner: '' }
		})
	}
}));

const mockUploads: IFormData[][] = [];
jest.mock('../../helpers/fileUpload', () => ({
	__esModule: true,
	default: class {
		constructor(_url: string, _headers: unknown, formData: IFormData[]) {
			mockUploads.push(formData);
		}

		send = () => Promise.resolve({ file: { _id: 'uploaded-file-id', url: '/file-upload/uploaded-file-id/secret' } });
	}
}));

jest.mock('../../helpers/fetch', () => ({ __esModule: true, default: jest.fn() }));

const SERVER = 'https://open.rocket.chat';
const ROOM_ID = 'room-id';
const FILE_NAME = 'salary-review.txt';
const CAPTION = 'the numbers we discussed';
const FILE_BYTES = Buffer.from('confidential file contents');

let tempDirectory: string;
let fileInfo: TSendFileMessageFileInfo;

const decrypt = (content: IMessage['content']) => webClientDecryptText(roomKeys.v2.sessionKeyExportedString, content);

const uploadedForm = () => {
	expect(mockUploads).toHaveLength(1);
	const [form] = mockUploads;
	return {
		file: form.find(({ name }) => name === 'file') as IFormData,
		content: JSON.parse(form.find(({ name }) => name === 'content')?.data as string)
	};
};

const mediaConfirmBody = () => {
	const calls = jest.mocked(fetch).mock.calls.filter(([url]) => url.includes('/rooms.mediaConfirm/'));
	expect(calls).toHaveLength(1);
	return JSON.parse(calls[0][1]?.body);
};

const sendFile = () => sendFileMessageV2(ROOM_ID, fileInfo, undefined, SERVER, { id: user.userId, token: 'auth-token' });

beforeAll(async () => {
	tempDirectory = await mkdtemp(join(tmpdir(), 'e2ee-upload-'));
});

afterAll(() => rm(tempDirectory, { recursive: true, force: true }));

beforeEach(async () => {
	jest.clearAllMocks();
	mockUploads.length = 0;
	mockDatabase = createInMemoryAppDatabase();
	await mockDatabase.write(async () => {
		const subscriptions = mockDatabase.get('subscriptions');
		await subscriptions.create(subscription => {
			subscription._raw = sanitizedRaw({ id: ROOM_ID }, subscriptions.schema);
			subscription.rid = ROOM_ID;
			subscription.encrypted = true;
			subscription.E2EKey = roomKeys.v2.E2EKey;
			subscription.e2eKeyId = roomKeys.v2.keyID;
		});
	});
	const path = join(await mkdtemp(join(tempDirectory, 'file-')), FILE_NAME);
	await writeFile(path, FILE_BYTES);
	fileInfo = {
		path: pathToFileURL(path).href,
		name: FILE_NAME,
		type: 'text/plain',
		size: FILE_BYTES.length,
		msg: CAPTION
	} as TSendFileMessageFileInfo;
	await Encryption.persistKeys(SERVER, JSON.parse(user.publicKey), user.privateKey);
	Encryption.initialize(user.userId);
});

afterEach(() => {
	Encryption.stop();
});

describe('sendFileMessageV2 in an encrypted room', () => {
	it('uploads, under a name that hides the original, bytes only the key in the content field decrypts', async () => {
		await sendFile();

		const { file, content } = uploadedForm();
		const { encryption } = await decrypt(content);
		const uploadedBytes = await readFile(fileURLToPath(file.uri as string));
		expect(file.filename).not.toContain('salary');
		expect(uploadedBytes).not.toEqual(FILE_BYTES);
		expect(await webClientDecryptFile(uploadedBytes, encryption)).toEqual(FILE_BYTES);
	});

	it('sends the form content field as ciphertext the web client decrypts', async () => {
		await sendFile();

		const { content } = uploadedForm();
		expect(JSON.stringify(content)).not.toContain(FILE_NAME);
		await expect(decrypt(content)).resolves.toMatchObject({ name: FILE_NAME, type: 'text/plain' });
	});

	it('confirms the upload with an e2e message whose caption and file name are ciphertext', async () => {
		await sendFile();

		const body = mediaConfirmBody();
		expect(body.t).toBe('e2e');
		expect(body).not.toHaveProperty('msg');
		expect(JSON.stringify(body)).not.toContain(CAPTION);
		expect(JSON.stringify(body)).not.toContain(FILE_NAME);
		await expect(decrypt(body.content)).resolves.toMatchObject({
			msg: CAPTION,
			file: { _id: 'uploaded-file-id', name: FILE_NAME }
		});
	});
});
