import { act, renderHook } from '@testing-library/react-native';

import { type TAnyMessageModel } from 'definitions';

import { useMessage } from './useMessage';

type Subscriber = () => void;

const buildFakeModel = (overrides: Partial<TAnyMessageModel> = {}): TAnyMessageModel & { _emit: () => void } => {
	const subscribers: Subscriber[] = [];

	const model = {
		id: 'msg-1',
		msg: 'Hello world',
		t: undefined,
		ts: new Date('2024-01-01T00:00:00Z'),
		u: { _id: 'u1', username: 'alice' },
		alias: undefined,
		groupable: true,
		avatar: undefined,
		emoji: undefined,
		attachments: [{ image_url: 'https://example.com/img.png' }],
		urls: [],
		status: 0,
		pinned: false,
		editedBy: null,
		reactions: { '👍': { usernames: ['alice'] } },
		role: undefined,
		drid: undefined,
		dcount: undefined,
		dlm: undefined,
		tmid: undefined,
		tcount: undefined,
		tlm: undefined,
		replies: ['u1'],
		mentions: [],
		channels: [],
		unread: false,
		autoTranslate: false,
		translations: null,
		tmsg: undefined,
		blocks: null,
		e2e: undefined,
		md: [{ type: 'PARAGRAPH' }],
		comment: undefined,
		...overrides,
		experimentalSubscribe(cb: Subscriber) {
			subscribers.push(cb);
			return () => {
				const idx = subscribers.indexOf(cb);
				if (idx !== -1) subscribers.splice(idx, 1);
			};
		},
		_emit() {
			subscribers.forEach(cb => cb());
		}
	} as unknown as TAnyMessageModel & { _emit: () => void };

	return model;
};

describe('useMessage', () => {
	it('returns a snapshot with the correct initial field values', () => {
		const model = buildFakeModel();
		const { result } = renderHook(() => useMessage(model));

		expect(result.current.id).toBe('msg-1');
		expect(result.current.msg).toBe('Hello world');
		expect(result.current.u).toEqual({ _id: 'u1', username: 'alice' });
		expect(result.current.ts).toEqual(new Date('2024-01-01T00:00:00Z'));
		expect(result.current.attachments).toBe(model.attachments);
		expect(result.current.reactions).toBe(model.reactions);
		expect(result.current.md).toBe(model.md);
		expect(result.current.replies).toBe(model.replies);
	});

	it('returns a new snapshot reflecting the changed field after a model mutation', () => {
		const model = buildFakeModel();
		const { result } = renderHook(() => useMessage(model));
		const before = result.current;

		act(() => {
			(model as any).msg = 'Updated message';
			model._emit();
		});

		expect(result.current).not.toBe(before);
		expect(result.current.msg).toBe('Updated message');
	});

	it('keeps the same reference for an unchanged @json field across an unrelated mutation', () => {
		const model = buildFakeModel();
		const { result } = renderHook(() => useMessage(model));

		const attachmentsBefore = result.current.attachments;
		const reactionsBefore = result.current.reactions;
		const mdBefore = result.current.md;

		act(() => {
			(model as any).msg = 'Changed msg only';
			model._emit();
		});

		expect(result.current.attachments).toBe(attachmentsBefore);
		expect(result.current.reactions).toBe(reactionsBefore);
		expect(result.current.md).toBe(mdBefore);
	});

	it('returns the new model snapshot synchronously when item identity changes', () => {
		const modelA = buildFakeModel({ id: 'msg-a', msg: 'Model A' });
		const modelB = buildFakeModel({ id: 'msg-b', msg: 'Model B' });

		const { result, rerender } = renderHook(({ model }: { model: typeof modelA }) => useMessage(model), {
			initialProps: { model: modelA }
		});

		expect(result.current.id).toBe('msg-a');
		expect(result.current.msg).toBe('Model A');

		act(() => {
			rerender({ model: modelB });
		});

		expect(result.current.id).toBe('msg-b');
		expect(result.current.msg).toBe('Model B');
	});
});
