jest.mock('~/lib/database', () => ({
	servers: {
		get: jest.fn(() => ({
			find: jest.fn(() => Promise.resolve({}))
		}))
	},
	active: {
		get: jest.fn()
	}
}));

jest.mock('~/lib/methods/helpers/showToast', () => ({
	showToast: jest.fn()
}));

jest.mock('expo-file-system/legacy', () => ({
	getInfoAsync: jest.fn(),
	readAsStringAsync: jest.fn(),
	EncodingType: { Base64: 'base64', UTF8: 'utf8' }
}));

jest.mock('~/lib/encryption/utils', () => ({
	isE2EEDisabledEncryptedRoom: jest.fn(() => false),
	isMissingRoomE2EEKey: jest.fn(() => false)
}));

const { showToast } = require('~/lib/methods/helpers/showToast');
const database = require('~/lib/database');
const EncryptionUtils = require('~/lib/encryption/utils') as {
	isE2EEDisabledEncryptedRoom: jest.Mock;
	isMissingRoomE2EEKey: jest.Mock;
};
const ExpoFileSystem = require('expo-file-system/legacy') as { getInfoAsync: jest.Mock; readAsStringAsync: jest.Mock };
const { ShareListView } = require('./index');

const makeInstance = ({
	mediaUris,
	attachments,
	serverVersion = '8.5.0',
	encryptionPasswordRequired = false
}: {
	mediaUris?: string;
	attachments: any[];
	serverVersion?: string;
	encryptionPasswordRequired?: boolean;
}) => {
	const shareListView = new ShareListView({
		navigation: {
			addListener: jest.fn(() => jest.fn()),
			setOptions: jest.fn(),
			navigate: jest.fn()
		} as any,
		shareExtensionParams: { text: undefined, mediaUris },
		serverVersion,
		encryptionPasswordRequired,
		dispatch: jest.fn(),
		theme: 'light',
		insets: { top: 0, bottom: 0, left: 0, right: 0 }
	} as any);

	shareListView.state = {
		...shareListView.state,
		attachments,
		serverInfo: {} as any
	};

	return shareListView;
};

describe('ShareListView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows a toast and does not navigate when a media share ends up with no valid attachments', () => {
		const shareListView = makeInstance({ mediaUris: 'file:///missing.jpg', attachments: [] });
		const { navigation } = shareListView.props as any;

		shareListView.shareMessage({ rid: 'room-id' } as any);

		expect(showToast).toHaveBeenCalledTimes(1);
		expect(navigation.navigate).not.toHaveBeenCalled();
	});

	it('navigates normally when at least one valid attachment remains', () => {
		const shareListView = makeInstance({
			mediaUris: 'file:///valid.jpg,file:///missing.jpg',
			attachments: [{ filename: 'valid.jpg', path: '/tmp/valid.jpg', size: 1, mime: 'image/jpeg' }]
		});
		const { navigation } = shareListView.props as any;

		shareListView.shareMessage({ rid: 'room-id' } as any);

		expect(showToast).not.toHaveBeenCalled();
		expect(navigation.navigate).toHaveBeenCalledTimes(1);
	});

	it('navigates normally for a text-only share with no attachments', () => {
		const shareListView = makeInstance({ mediaUris: undefined, attachments: [] });
		const { navigation } = shareListView.props as any;

		shareListView.shareMessage({ rid: 'room-id' } as any);

		expect(showToast).not.toHaveBeenCalled();
		expect(navigation.navigate).toHaveBeenCalledTimes(1);
	});

	it('toasts and closes before channel select when no shared file is valid', async () => {
		ExpoFileSystem.getInfoAsync.mockResolvedValue({ exists: false, uri: 'file:///missing.jpg' });
		const shareListView = makeInstance({ mediaUris: 'file:///missing.jpg', attachments: [] });
		const { dispatch } = shareListView.props as any;

		await shareListView.componentDidMount();

		expect(showToast).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledTimes(1);
	});

	it('does not toast on mount when at least one shared file is valid', async () => {
		ExpoFileSystem.getInfoAsync.mockResolvedValue({ exists: true, uri: 'file:///valid.jpg', size: 1 });
		ExpoFileSystem.readAsStringAsync.mockResolvedValue('');
		const shareListView = makeInstance({ mediaUris: 'file:///valid.jpg', attachments: [] });
		const { dispatch } = shareListView.props as any;

		await shareListView.componentDidMount();

		expect(showToast).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('toasts and closes before channel select when the shared file exists but is not readable', async () => {
		ExpoFileSystem.getInfoAsync.mockResolvedValue({ exists: true, uri: 'file:///unreadable.jpg', size: 1 });
		ExpoFileSystem.readAsStringAsync.mockRejectedValue(new Error('Permission denied'));
		const shareListView = makeInstance({ mediaUris: 'file:///unreadable.jpg', attachments: [] });
		const { dispatch } = shareListView.props as any;

		await shareListView.componentDidMount();

		expect(showToast).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledTimes(1);
	});

	it('decodes a Cyrillic filename and keeps the share-collision UUID prefix on mount', async () => {
		const uri = 'file:///group/550e8400-e29b-41d4-a716-446655440000-%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80.pdf';
		ExpoFileSystem.getInfoAsync.mockResolvedValue({ exists: true, uri, size: 10 });
		ExpoFileSystem.readAsStringAsync.mockResolvedValue('');
		const shareListView = makeInstance({ mediaUris: uri, attachments: [] });
		const setStateSpy = jest.fn();
		(shareListView as any).setState = setStateSpy;

		await shareListView.componentDidMount();

		expect(showToast).not.toHaveBeenCalled();
		expect(setStateSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				attachments: [expect.objectContaining({ filename: '550e8400-e29b-41d4-a716-446655440000-Пример.pdf', path: uri })]
			})
		);
	});

	it('lists encrypted rooms alongside unencrypted ones', async () => {
		database.active.get.mockReturnValueOnce({
			query: () => ({
				fetch: () =>
					Promise.resolve([
						{ rid: 'encrypted-room', encrypted: true, E2EKey: 'key' },
						{ rid: 'plain-room', encrypted: false }
					])
			})
		});
		const shareListView = makeInstance({ attachments: [] });

		const rooms = await shareListView.query();

		expect(rooms.map((room: { rid: string }) => room.rid)).toEqual(['encrypted-room', 'plain-room']);
	});

	it('leaves encrypted rooms out on servers older than 6.10, which upload files unencrypted', async () => {
		const subscriptionsQuery = jest.fn((..._clauses: unknown[]) => ({ fetch: () => Promise.resolve([]) }));
		database.active.get.mockReturnValueOnce({ query: subscriptionsQuery });
		const shareListView = makeInstance({ attachments: [], serverVersion: '6.9.0' });

		await shareListView.query();

		expect(subscriptionsQuery.mock.calls[0]).toContainEqual(expect.objectContaining({ left: 'encrypted' }));
	});

	it('keeps encrypted rooms in the query on servers from 6.10', async () => {
		const subscriptionsQuery = jest.fn((..._clauses: unknown[]) => ({ fetch: () => Promise.resolve([]) }));
		database.active.get.mockReturnValueOnce({ query: subscriptionsQuery });
		const shareListView = makeInstance({ attachments: [] });

		await shareListView.query();

		expect(subscriptionsQuery.mock.calls[0]).not.toContainEqual(expect.objectContaining({ left: 'encrypted' }));
	});

	it('disables an encrypted room and explains why when the E2EE password was not entered', () => {
		EncryptionUtils.isE2EEDisabledEncryptedRoom.mockReturnValueOnce(true);
		const shareListView = makeInstance({ attachments: [], encryptionPasswordRequired: true });

		const row = shareListView.renderItem({ item: { rid: 'encrypted-room', t: 'p', encrypted: true }, index: 0 });

		expect(row.props.disabledReason).toBe('Enter your E2EE password to share here');
		expect(row.props.description).toBe('Enter your E2EE password to share here');
	});

	it('says it is waiting for keys, not asking for the password, while encryption is still starting', () => {
		EncryptionUtils.isE2EEDisabledEncryptedRoom.mockReturnValueOnce(true);
		const shareListView = makeInstance({ attachments: [] });

		const row = shareListView.renderItem({ item: { rid: 'encrypted-room', t: 'p', encrypted: true }, index: 0 });

		expect(row.props.disabledReason).toBe('Waiting for encryption keys');
	});

	it('disables an encrypted room and explains why when its key has not arrived yet', () => {
		EncryptionUtils.isMissingRoomE2EEKey.mockReturnValueOnce(true);
		const shareListView = makeInstance({ attachments: [] });

		const row = shareListView.renderItem({ item: { rid: 'encrypted-room', t: 'p', encrypted: true }, index: 0 });

		expect(row.props.disabledReason).toBe('Waiting for encryption keys');
		expect(row.props.description).toBe('Waiting for encryption keys');
	});

	it('keeps a shareable encrypted room enabled with its own description', () => {
		const shareListView = makeInstance({ attachments: [] });

		const row = shareListView.renderItem({
			item: { rid: 'encrypted-room', t: 'p', encrypted: true, E2EKey: 'key', topic: 'Room topic' },
			index: 0
		});

		expect(row.props.disabledReason).toBeUndefined();
		expect(row.props.description).toBe('Room topic');
	});
});
