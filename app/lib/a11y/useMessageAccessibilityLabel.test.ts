import { renderHook } from '@testing-library/react-native';

import { useMessageAccessibilityLabel } from './useMessageAccessibilityLabel';

const baseProps: any = {
	msg: 'hello world',
	author: { username: 'john', name: 'John Doe' },
	ts: new Date('2024-01-01T10:30:00Z'),
	isInfo: false,
	isThreadReply: false,
	isThreadSequential: false,
	isEncrypted: false,
	isTranslated: false,
	isReadReceiptEnabled: false,
	useRealName: false,
	unread: false,
	type: 'msg'
};

describe('useMessageAccessibilityLabel', () => {
	it('returns username, hour and message for a plain message', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel({ ...baseProps }));
		expect(result.current).toContain('john');
		expect(result.current).toContain('hello world');
	});

	it('uses author.name when useRealName is true', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel({ ...baseProps, useRealName: true }));
		expect(result.current).toContain('John Doe');
		expect(result.current).not.toMatch(/\bjohn\b/);
	});

	it('prefixes label with "thread message" when tmid is set', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel({ ...baseProps, tmid: 'tmid123' }));
		expect(result.current).toContain('thread message hello world');
	});

	it('prefixes label with "thread message" when isThreadSequential', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel({ ...baseProps, isThreadSequential: true }));
		expect(result.current).toContain('thread message hello world');
	});

	it('replaces "Encrypted message" when isEncrypted is true', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel({ ...baseProps, isEncrypted: true }));
		expect(result.current).toContain('Encrypted message');
	});

	it('strips @ from mentions and # from channels', () => {
		const { result } = renderHook(() =>
			useMessageAccessibilityLabel({
				...baseProps,
				msg: 'hey @alice check #general',
				mentions: [{ username: 'alice' }],
				channels: [{ name: 'general' }]
			})
		);
		expect(result.current).toContain('hey alice check general');
		expect(result.current).not.toContain('@alice');
		expect(result.current).not.toContain('#general');
	});

	it('appends "Message was read" when read receipt is enabled and message is read', () => {
		const { result } = renderHook(() =>
			useMessageAccessibilityLabel({ ...baseProps, isReadReceiptEnabled: true, unread: false })
		);
		expect(result.current).toContain('Message was read');
	});

	it('appends "Message was not read" when read receipt is enabled and message is unread', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel({ ...baseProps, isReadReceiptEnabled: true, unread: true }));
		expect(result.current).toContain('Message was not read');
	});

	it('omits read receipt when isReadReceiptEnabled is false', () => {
		const { result } = renderHook(() => useMessageAccessibilityLabel({ ...baseProps, isReadReceiptEnabled: false }));
		expect(result.current).not.toContain('Message was read');
		expect(result.current).not.toContain('Message was not read');
	});

	it('returns only translated label when isTranslated is true', () => {
		const { result } = renderHook(() =>
			useMessageAccessibilityLabel({ ...baseProps, isTranslated: true, autoTranslateLanguage: 'en' })
		);
		expect(result.current).toContain('Message translated into English');
		expect(result.current).not.toContain('hello world');
	});

	it('uses info message text when isInfo is set', () => {
		const { result } = renderHook(() =>
			useMessageAccessibilityLabel({
				...baseProps,
				isInfo: true,
				type: 'uj',
				msg: ''
			})
		);
		expect(result.current).toContain('joined the channel');
	});

	it('omits read receipt for info messages even when receipt is enabled', () => {
		const { result } = renderHook(() =>
			useMessageAccessibilityLabel({
				...baseProps,
				isInfo: true,
				type: 'uj',
				isReadReceiptEnabled: true,
				unread: true
			})
		);
		expect(result.current).not.toContain('Message was not read');
	});
});
