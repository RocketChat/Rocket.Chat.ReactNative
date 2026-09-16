import buildMessage from './buildMessage';
import normalizeMessage from './normalizeMessage';

describe('buildMessage', () => {
	it('sets status to SENT and returns the normalized message', () => {
		const input = { _id: 'm1', msg: 'hi', status: 1 } as any;
		const result = buildMessage(input) as any;

		expect(input.status).toBe(0);
		expect(result?.status).toBe(0);
		expect(result?.attachments).toEqual([]);
	});
});

describe('normalizeMessage', () => {
	it('returns null for falsy input', () => {
		expect(normalizeMessage(null)).toBeNull();
		expect(normalizeMessage(undefined)).toBeNull();
		expect(normalizeMessage('')).toBeNull();
	});

	it('mutates the input in place and returns the same object', () => {
		const input = { _id: 'm1' } as any;

		expect(normalizeMessage(input)).toBe(input);
	});

	it('defaults attachments to [] when missing or non-array', () => {
		expect((normalizeMessage({ _id: 'm1' } as any) as any).attachments).toEqual([]);
		expect((normalizeMessage({ _id: 'm1', attachments: 'nope' } as any) as any).attachments).toEqual([]);
	});

	it('filters falsy attachments and defaults both fields and nested attachments to []', () => {
		const result = normalizeMessage({
			_id: 'm1',
			attachments: [null, { title: 'a' }, 0, { title: 'b', fields: [{ title: 'f' }] }]
		} as any) as any;

		expect(result.attachments).toHaveLength(2);
		expect(result.attachments[0]).toEqual({ title: 'a', fields: [], attachments: [] });
		expect(result.attachments[1].fields).toEqual([{ title: 'f' }]);
	});

	it('converts att.ts to Date recursively for nested attachments', () => {
		const ts = Date.UTC(2024, 0, 15, 12, 0, 0);
		const result = normalizeMessage({
			_id: 'm1',
			attachments: [{ title: 'a', ts, attachments: [{ title: 'nested', ts }] }]
		} as any) as any;

		expect(result.attachments[0].ts).toBeInstanceOf(Date);
		expect(result.attachments[0].ts.getTime()).toBe(ts);
		expect(result.attachments[0].attachments[0].ts).toBeInstanceOf(Date);
		expect(result.attachments[0].attachments[0].ts.getTime()).toBe(ts);
	});

	it('leaves a falsy att.ts unconverted', () => {
		const result = normalizeMessage({ _id: 'm1', attachments: [{ title: 'a', ts: 0 }] } as any) as any;

		expect(result.attachments[0].ts).toBe(0);
		expect(result.attachments[0].ts).not.toBeInstanceOf(Date);
	});

	it('converts an unparseable att.ts into an Invalid Date rather than throwing', () => {
		const result = normalizeMessage({ _id: 'm1', attachments: [{ title: 'a', ts: 'garbage' }] } as any) as any;

		expect(result.attachments[0].ts).toBeInstanceOf(Date);
		expect(Number.isNaN(result.attachments[0].ts.getTime())).toBe(true);
	});

	it('defaults reactions to [] and unread to false when absent', () => {
		const result = normalizeMessage({ _id: 'm1' } as any) as any;

		expect(result.reactions).toEqual([]);
		expect(result.unread).toBe(false);
	});

	it('preserves unread when true', () => {
		expect((normalizeMessage({ _id: 'm1', unread: true } as any) as any).unread).toBe(true);
	});

	it('converts object-shaped reactions into an array', () => {
		const result = normalizeMessage({
			_id: 'm1',
			reactions: { ':smile:': { usernames: ['a'], names: ['A'] } }
		} as any) as any;

		expect(result.reactions).toEqual([{ _id: 'm1:smile:', emoji: ':smile:', usernames: ['a'], names: ['A'] }]);
	});

	it('leaves array-shaped reactions untouched', () => {
		const reactions = [{ _id: 'm1:smile:', emoji: ':smile:', usernames: ['a'], names: ['A'] }];
		const result = normalizeMessage({ _id: 'm1', reactions } as any) as any;

		expect(result.reactions).toEqual(reactions);
	});

	it('converts translations object to array and sets autoTranslate', () => {
		const result = normalizeMessage({ _id: 'm1', translations: { en: 'hi', pt: 'oi' } } as any) as any;

		expect(result.translations).toEqual([
			{ _id: 'm1en', language: 'en', value: 'hi' },
			{ _id: 'm1pt', language: 'pt', value: 'oi' }
		]);
		expect(result.autoTranslate).toBe(true);
	});

	it('leaves autoTranslate unset when translations are empty or absent', () => {
		expect((normalizeMessage({ _id: 'm1' } as any) as any).autoTranslate).toBeUndefined();
		expect((normalizeMessage({ _id: 'm1', translations: {} } as any) as any).autoTranslate).toBeUndefined();
	});

	it('parses urls when present, else defaults to []', () => {
		expect((normalizeMessage({ _id: 'm1' } as any) as any).urls).toEqual([]);

		const result = normalizeMessage({
			_id: 'm1',
			urls: [
				{
					url: 'https://meet.google.com/xxx',
					meta: { ogTitle: 'Meet', ogDescription: 'desc', ogImage: 'https://example.com/logo.png' }
				}
			]
		} as any) as any;

		expect(result.urls).toEqual([
			{ _id: 0, title: 'Meet', description: 'desc', image: 'https://example.com/logo.png', url: 'https://meet.google.com/xxx' }
		]);
	});

	it('defaults _updatedAt to now when absent, preserves it when present', () => {
		const before = Date.now();
		const defaulted = normalizeMessage({ _id: 'm1' } as any) as any;
		const after = Date.now();

		expect(defaulted._updatedAt).toBeInstanceOf(Date);
		expect(defaulted._updatedAt.getTime()).toBeGreaterThanOrEqual(before);
		expect(defaulted._updatedAt.getTime()).toBeLessThanOrEqual(after);

		const kept = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
		expect((normalizeMessage({ _id: 'm1', _updatedAt: kept } as any) as any)._updatedAt).toBe(kept);
	});

	it('normalizes starred', () => {
		expect((normalizeMessage({ _id: 'm1', starred: [{ _id: 'u1' }] } as any) as any).starred).toBe(true);
		expect((normalizeMessage({ _id: 'm1', starred: [] } as any) as any).starred).toBe(false);
		expect((normalizeMessage({ _id: 'm1', starred: { _id: 'u1' } } as any) as any).starred).toBe(true);
		expect((normalizeMessage({ _id: 'm1' } as any) as any).starred).toBeUndefined();
	});

	it('is not idempotent: a second pass corrupts translations and empties urls', () => {
		const msg = {
			_id: 'm1',
			translations: { en: 'hi' },
			urls: [{ url: 'https://a.com/x', meta: { ogTitle: 'T' } }],
			reactions: { ':a:': { usernames: ['u'], names: ['N'] } },
			starred: [{ _id: 'u1' }]
		} as any;

		normalizeMessage(msg);

		expect(msg.translations).toEqual([{ _id: 'm1en', language: 'en', value: 'hi' }]);
		expect(msg.urls).toEqual([{ _id: 0, title: 'T', url: 'https://a.com/x' }]);

		normalizeMessage(msg);

		expect(msg.translations).toEqual([{ _id: 'm10', language: '0', value: { _id: 'm1en', language: 'en', value: 'hi' } }]);
		expect(msg.urls).toEqual([]);
		expect(msg.reactions).toEqual([{ _id: 'm1:a:', emoji: ':a:', usernames: ['u'], names: ['N'] }]);
		expect(msg.starred).toBe(true);
	});
});
