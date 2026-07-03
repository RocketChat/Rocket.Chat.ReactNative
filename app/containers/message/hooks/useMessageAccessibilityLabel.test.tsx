import { Provider } from 'react-redux';
import { render } from '@testing-library/react-native';

import { useMessageAccessibilityLabel } from './useMessageAccessibilityLabel';
import { MessageProvider } from '../MessageStore';
import { MessageRoomProvider, pickMessageRoomState } from '../MessageRoomStore';
import { updateSettings } from '../../../actions/settings';
import { mockedStore } from '../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../definitions';
import { E2E_MESSAGE_TYPE } from '../../../lib/constants/keys';

jest.mock('../../../lib/hooks/useAltTextSupported', () => ({
	useAltTextSupported: () => false
}));

const FIXED_TS = new Date('2024-01-15T12:34:56Z');
const HOUR = FIXED_TS.toLocaleTimeString();

const buildItem = (overrides: Partial<TAnyMessageModel> = {}): TAnyMessageModel =>
	({
		id: 'msg-1',
		msg: 'hello world',
		ts: FIXED_TS,
		u: { _id: 'u1', username: 'alice', name: 'Alice' },
		unread: false,
		...overrides
	} as TAnyMessageModel);

const renderLabel = (item: TAnyMessageModel, config: Record<string, any> = {}, previousItem?: TAnyMessageModel) => {
	const spy = jest.fn();
	const Probe = () => {
		spy(useMessageAccessibilityLabel());
		return null;
	};
	render(
		<Provider store={mockedStore}>
			<MessageRoomProvider {...pickMessageRoomState(config)}>
				<MessageProvider item={item} previousItem={previousItem}>
					<Probe />
				</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);
	const { calls } = spy.mock;
	return calls[calls.length - 1][0];
};

describe('useMessageAccessibilityLabel', () => {
	it('builds the default label with user, hour and message', () => {
		expect(renderLabel(buildItem())).toBe(`alice ${HOUR} hello world.`);
	});

	it('prefixes the message with "thread message" when the message has a tmid', () => {
		expect(renderLabel(buildItem({ tmid: 't1' }))).toBe(`alice ${HOUR} thread message hello world.`);
	});

	it('replaces the body with the encrypted placeholder and appends it to the suffix', () => {
		expect(renderLabel(buildItem({ t: E2E_MESSAGE_TYPE, e2e: 'pending' }))).toBe(
			`alice ${HOUR} Encrypted message. Encrypted message`
		);
	});

	it('uses the author real name when useRealName is true', () => {
		mockedStore.dispatch(updateSettings('UI_Use_Real_Name', true));
		try {
			expect(renderLabel(buildItem())).toBe(`Alice ${HOUR} hello world.`);
		} finally {
			mockedStore.dispatch(updateSettings('UI_Use_Real_Name', false));
		}
	});

	it('omits the hour when ts is missing', () => {
		expect(renderLabel(buildItem({ ts: undefined }))).toBe('alice hello world.');
	});

	it('strips @username and #channel sigils via mentions/channels lists', () => {
		expect(
			renderLabel(
				buildItem({
					msg: 'hey @alice check #general',
					mentions: [{ _id: 'u1', username: 'alice', name: 'Alice', type: 'user' }],
					channels: [{ _id: 'c1', name: 'general' }]
				})
			)
		).toBe(`alice ${HOUR} hey alice check general.`);
	});

	it('appends "Message was read" when read receipts are enabled and the message is read', () => {
		expect(renderLabel(buildItem({ unread: false }), { isReadReceiptEnabled: true })).toBe(
			`alice ${HOUR} hello world. Message was read`
		);
	});

	it('appends "Message was not read" when read receipts are enabled and the message is unread', () => {
		expect(renderLabel(buildItem({ unread: true }), { isReadReceiptEnabled: true })).toBe(
			`alice ${HOUR} hello world. Message was not read`
		);
	});

	it('omits the read-receipt suffix for info messages', () => {
		expect(renderLabel(buildItem({ t: 'uj', u: { _id: 'u1', username: 'alice' } }), { isReadReceiptEnabled: true })).toBe(
			`alice ${HOUR} joined the channel.`
		);
	});

	it('appends the image description to the suffix', () => {
		expect(
			renderLabel(
				buildItem({ msg: 'caption', attachments: [{ image_url: 'https://example.com/img.png', altText: 'A wavy pattern' }] })
			)
		).toBe(`alice ${HOUR} caption. Image description: A wavy pattern`);
	});

	it('does not announce "undefined" for attachment-only messages', () => {
		expect(
			renderLabel(
				buildItem({ msg: undefined, attachments: [{ image_url: 'https://example.com/img.png', altText: 'A wavy pattern' }] })
			)
		).toBe(`alice ${HOUR}. Image description: A wavy pattern`);
	});

	it('builds a translated message with only user, hour and translated marker as prefix', () => {
		expect(
			renderLabel(buildItem({ autoTranslate: true, translations: [{ _id: 't1', language: 'en', value: 'translated text' }] }), {
				autoTranslateRoom: true,
				autoTranslateLanguage: 'en',
				user: { username: 'bob' }
			})
		).toBe(`alice ${HOUR} Message translated into English.`);
	});

	it('still appends suffix metadata (image description, encryption, read receipt) on translated messages', () => {
		expect(
			renderLabel(
				buildItem({
					msg: 'caption',
					autoTranslate: true,
					translations: [{ _id: 't1', language: 'en', value: 'translated text' }],
					unread: true,
					attachments: [{ image_url: 'https://example.com/img.png', altText: 'A wavy pattern' }]
				}),
				{ isReadReceiptEnabled: true, autoTranslateRoom: true, autoTranslateLanguage: 'en', user: { username: 'bob' } }
			)
		).toBe(`alice ${HOUR} Message translated into English. Image description: A wavy pattern Message was not read`);
	});
});
