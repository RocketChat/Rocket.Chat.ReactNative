import { renderHook } from '@testing-library/react-native';

import { useMessageAccessibilityLabel } from './useMessageAccessibilityLabel';
import { type IMessage, type IMessageTouchable } from '../interfaces';

type TProps = IMessage & IMessageTouchable;

const FIXED_TS = new Date('2024-01-15T12:34:56Z');
const HOUR = FIXED_TS.toLocaleTimeString();

const buildProps = (overrides: Partial<TProps> = {}): TProps =>
	({
		msg: 'hello world',
		ts: FIXED_TS,
		author: { _id: 'u1', username: 'alice', name: 'Alice' },
		isInfo: false,
		isThreadReply: false,
		isThreadSequential: false,
		isEncrypted: false,
		isTranslated: false,
		isReadReceiptEnabled: false,
		unread: false,
		useRealName: false,
		...overrides
	} as TProps);

describe('useMessageAccessibilityLabel', () => {
	it('builds the default label with user, hour and message', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel(buildProps()));
		expect(result.current).toBe(`alice ${HOUR} hello world.`);
	});

	it('prefixes the message with "thread message" when tmid is set', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel(buildProps({ tmid: 't1' })));
		expect(result.current).toBe(`alice ${HOUR} thread message hello world.`);
	});

	it('uses "replying to" for a thread reply', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel(buildProps({ isThreadReply: true })));
		expect(result.current).toBe(`alice ${HOUR} replying to hello world.`);
	});

	it('uses "replying to thread message" for a thread reply with tmid', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel(buildProps({ isThreadReply: true, tmid: 't1' })));
		expect(result.current).toBe(`alice ${HOUR} replying to thread message hello world.`);
	});

	it('uses "thread message" for a sequential thread message', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel(buildProps({ isThreadSequential: true })));
		expect(result.current).toBe(`alice ${HOUR} thread message hello world.`);
	});

	it('replaces the body with the encrypted placeholder and appends it to the suffix', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel(buildProps({ isEncrypted: true })));
		expect(result.current).toBe(`alice ${HOUR} Encrypted message. Encrypted message`);
	});

	it('uses the author real name when useRealName is true', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel(buildProps({ useRealName: true })));
		expect(result.current).toBe(`Alice ${HOUR} hello world.`);
	});

	it('omits the hour when ts is missing', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel(buildProps({ ts: undefined })));
		expect(result.current).toBe('alice hello world.');
	});

	it('strips @username and #channel sigils via mentions/channels lists', () => {
		const { result } = renderHook(() =>
			useMessageAccessibilityLabel(
				buildProps({
					msg: 'hey @alice check #general',
					mentions: [{ _id: 'u1', username: 'alice', name: 'Alice', type: 'user' }],
					channels: [{ _id: 'c1', name: 'general' }]
				})
			)
		);
		expect(result.current).toBe(`alice ${HOUR} hey alice check general.`);
	});

	it('appends "Message was read" when read receipts are enabled and the message is read', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel(buildProps({ isReadReceiptEnabled: true, unread: false })));
		expect(result.current).toBe(`alice ${HOUR} hello world. Message was read`);
	});

	it('appends "Message was not read" when read receipts are enabled and the message is unread', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel(buildProps({ isReadReceiptEnabled: true, unread: true })));
		expect(result.current).toBe(`alice ${HOUR} hello world. Message was not read`);
	});

	it('omits the read-receipt suffix for info messages', () => {
		const { result } = renderHook(() =>
			useMessageAccessibilityLabel(
				buildProps({ isReadReceiptEnabled: true, isInfo: true, type: 'uj', author: { _id: 'u1', username: 'alice' } })
			)
		);
		expect(result.current).toBe(`alice ${HOUR} joined the channel.`);
	});

	it('appends the image description to the suffix', () => {
		const { result } = renderHook(() =>
			useMessageAccessibilityLabel(
				buildProps({
					msg: 'caption',
					attachments: [{ image_url: 'https://example.com/img.png', altText: 'A wavy pattern' }]
				})
			)
		);
		expect(result.current).toBe(`alice ${HOUR} caption. Image description: A wavy pattern`);
	});

	it('builds a translated message with only user, hour and translated marker as prefix', () => {
		const { result } = renderHook(() =>
			useMessageAccessibilityLabel(buildProps({ isTranslated: true, autoTranslateLanguage: 'en' }))
		);
		expect(result.current).toBe(`alice ${HOUR} Message translated into English.`);
	});

	it('still appends suffix metadata (image description, encryption, read receipt) on translated messages', () => {
		const { result } = renderHook(() =>
			useMessageAccessibilityLabel(
				buildProps({
					msg: 'caption',
					isTranslated: true,
					autoTranslateLanguage: 'en',
					isReadReceiptEnabled: true,
					unread: true,
					attachments: [{ image_url: 'https://example.com/img.png', altText: 'A wavy pattern' }]
				})
			)
		);
		expect(result.current).toBe(
			`alice ${HOUR} Message translated into English. Image description: A wavy pattern Message was not read`
		);
	});

	it('falls back to English when autoTranslateLanguage is missing', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel(buildProps({ isTranslated: true })));
		expect(result.current).toBe(`alice ${HOUR} Message translated into English.`);
	});
});
