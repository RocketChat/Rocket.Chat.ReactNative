import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Keyboard, Text } from 'react-native';
import { Provider } from 'react-redux';

import { type IAttachment, type TAnyMessageModel } from '../../../../definitions';
import { mockedStore } from '../../../../reducers/mockedStore';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../../lib/constants/keys';
import { messagesStatus } from '../../../../lib/constants/messagesStatus';
import openLink from '../../../../lib/methods/helpers/openLink';
import { MessageRoomProvider, type MessageRoomState } from '../MessageRoomStore';
import {
	MessageProvider,
	useAvatar,
	useBlocks,
	useContentData,
	useDiscussion,
	useIsEdited,
	useIsEncrypted,
	useIsInfoMessage,
	useMessageAuthor,
	useMessageField,
	useMessageGrouping,
	useMessageIgnored,
	useMessageHeaderMeta,
	useMessageItem,
	useMessageLongPress,
	useMessagePress,
	useMessageStatus,
	useMessageText,
	useMessageTouchable,
	useOnLinkPress,
	useReactions,
	useRepliedThreadData,
	useRevealIgnored,
	useThreadData,
	useThreadPosition,
	useTranslateLanguage,
	useUrls
} from '../MessageStore';

jest.mock('../../../../lib/methods/helpers/openLink', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockOpenLink = openLink as jest.Mock;

type Subscriber = () => void;

type FakeModel = TAnyMessageModel & { _emit: () => void; experimentalSubscribe: (cb: Subscriber) => () => void };

const buildFakeModel = (overrides: Partial<TAnyMessageModel> = {}): FakeModel => {
	const subscribers: Subscriber[] = [];

	const model = {
		id: 'msg-1',
		msg: 'Hello world',
		t: undefined,
		u: { _id: 'u1', username: 'alice' },
		alias: undefined,
		role: undefined,
		avatar: undefined,
		emoji: undefined,
		attachments: [{ image_url: 'https://example.com/img.png' }],
		urls: [],
		reactions: [{ emoji: '👍', usernames: ['alice'] }],
		blocks: null,
		dcount: undefined,
		dlm: undefined,
		tmid: undefined,
		tcount: undefined,
		tlm: undefined,
		tmsg: undefined,
		mentions: [],
		channels: [],
		comment: undefined,
		pinned: false,
		md: [{ type: 'PARAGRAPH' }],
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
	} as unknown as FakeModel;

	return model;
};

// One probe per `probes` entry; mirrors how each leaf calls a single domain hook.
const renderMessage = (item: TAnyMessageModel, probes: Record<string, () => unknown>) => {
	const probeSpies: Record<string, jest.Mock> = {};

	const probeElements = Object.entries(probes).map(([name, useHook]) => {
		const spy = jest.fn();
		probeSpies[name] = spy;
		const Probe = () => {
			spy(useHook());
			return null;
		};
		return <Probe key={name} />;
	});

	render(
		<MessageProvider item={item}>
			<>{probeElements}</>
		</MessageProvider>
	);

	const renderCount = (name: string) => probeSpies[name].mock.calls.length;
	const latestValue = (name: string) => {
		const { calls } = probeSpies[name].mock;
		return calls[calls.length - 1]?.[0];
	};

	return { renderCount, latestValue };
};

const MsgValueProbe = ({ item, spy }: { item: TAnyMessageModel; spy: jest.Mock }) => (
	<MessageProvider item={item}>
		<MsgValueReporter spy={spy} />
	</MessageProvider>
);

const MsgValueReporter = ({ spy }: { spy: jest.Mock }) => {
	spy(useMessageField(m => m.msg));
	return null;
};

// Derived hooks read both the per-row store/item/previousItem and the room state in
// MessageRoomProvider, so the probe needs both providers mounted.
const renderDerived = (
	item: TAnyMessageModel,
	useHook: () => unknown,
	{ previousItem, config }: { previousItem?: TAnyMessageModel; config?: Partial<MessageRoomState> } = {}
) => {
	const spy = jest.fn();
	const Probe = () => {
		spy(useHook());
		return null;
	};
	render(
		<Provider store={mockedStore}>
			<MessageRoomProvider {...(config ?? {})}>
				<MessageProvider item={item} previousItem={previousItem}>
					<Probe />
				</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);
	const latest = () => {
		const { calls } = spy.mock;
		return calls[calls.length - 1]?.[0];
	};
	return { latest, spy };
};

const wrapWithProviders =
	(item: TAnyMessageModel, config?: Partial<MessageRoomState>) =>
	({ children }: { children: ReactNode }) =>
		(
			<Provider store={mockedStore}>
				<MessageRoomProvider {...(config ?? {})}>
					<MessageProvider item={item}>{children}</MessageProvider>
				</MessageRoomProvider>
			</Provider>
		);

// Like wrapWithProviders, but also forwards the row-level MessageProvider props (onPress,
// onLongPress, isIgnored) needed by the touch/press/long-press hooks.
const renderMessageHook = <T,>(
	useHook: () => T,
	item: TAnyMessageModel,
	options: {
		isIgnored?: boolean;
		onPress?: () => void;
		onLongPress?: (msg: TAnyMessageModel) => void;
		config?: Partial<MessageRoomState>;
	} = {}
) =>
	renderHook(() => useHook(), {
		wrapper: ({ children }: { children: ReactNode }) => (
			<Provider store={mockedStore}>
				<MessageRoomProvider {...(options.config ?? {})}>
					<MessageProvider item={item} isIgnored={options.isIgnored} onPress={options.onPress} onLongPress={options.onLongPress}>
						{children}
					</MessageProvider>
				</MessageRoomProvider>
			</Provider>
		)
	});

describe('MessageStore', () => {
	describe('field hooks', () => {
		it('return the current field values', () => {
			const model = buildFakeModel();
			const { latestValue } = renderMessage(model, { reactions: useReactions, urls: useUrls, author: useMessageAuthor });

			expect(latestValue('reactions')).toBe(model.reactions);
			expect(latestValue('urls')).toBe(model.urls);
			expect(latestValue('author')).toEqual({ u: model.u, alias: model.alias, role: model.role });
		});

		it('return the new value after a model mutation followed by an experimentalSubscribe emit', () => {
			const model = buildFakeModel();
			const { latestValue } = renderMessage(model, { urls: useUrls });

			act(() => {
				(model as any).urls = [{ url: 'https://rocket.chat' }];
				model._emit();
			});

			expect(latestValue('urls')).toEqual([{ url: 'https://rocket.chat' }]);
		});

		it('does not throw and returns current values for a plain object without experimentalSubscribe', () => {
			const plainItem = {
				id: 'rest-1',
				msg: 'Plain REST message',
				reactions: [{ emoji: '👍', usernames: ['alice'] }]
			} as unknown as TAnyMessageModel;

			expect(() => renderMessage(plainItem, { reactions: useReactions })).not.toThrow();
		});

		it('reflects an item identity change', () => {
			const modelA = buildFakeModel({ id: 'msg-a', msg: 'Model A' });
			const modelB = buildFakeModel({ id: 'msg-b', msg: 'Model B' });
			const spy = jest.fn();

			const { rerender } = render(<MsgValueProbe item={modelA} spy={spy} />);
			expect(spy).toHaveBeenLastCalledWith('Model A');

			act(() => rerender(<MsgValueProbe item={modelB} spy={spy} />));

			expect(spy).toHaveBeenLastCalledWith('Model B');
		});

		it('useMessageItem returns a stable ref across a tick bump (in-place mutation)', () => {
			const model = buildFakeModel();
			const { renderCount, latestValue } = renderMessage(model, { item: useMessageItem });

			expect(latestValue('item')).toBe(model);
			const baseline = renderCount('item');

			act(() => {
				(model as any).urls = [{ url: 'x' }];
				model._emit();
			});

			expect(renderCount('item')).toBe(baseline);
			expect(latestValue('item')).toBe(model);
		});
	});

	describe('domain hooks', () => {
		it('useBlocks selects blocks and id', () => {
			const model = buildFakeModel({ blocks: [{ type: 'divider', appId: 'app-1' }] });
			const { latestValue } = renderMessage(model, { blocks: useBlocks });
			expect(latestValue('blocks')).toEqual({ blocks: model.blocks, id: model.id });
		});

		it('useDiscussion selects dcount and dlm', () => {
			const model = buildFakeModel({ msg: 'discuss', dcount: 2, dlm: new Date('2024-01-01') });
			const { latestValue } = renderMessage(model, { discussion: useDiscussion });
			expect(latestValue('discussion')).toEqual({ dcount: model.dcount, dlm: model.dlm });
		});

		it('useThreadData selects tcount, tlm, tmid and id', () => {
			const model = buildFakeModel({ tmid: 't1', tcount: 3, tlm: new Date('2024-01-02') });
			const { latestValue } = renderMessage(model, { thread: useThreadData });
			expect(latestValue('thread')).toEqual({
				tcount: model.tcount,
				tlm: model.tlm,
				tmid: model.tmid,
				id: model.id
			});
		});

		it('useRepliedThreadData selects tmid, tmsg and id', () => {
			const model = buildFakeModel({ tmid: 't1', tmsg: 'replied' });
			const { latestValue } = renderMessage(model, { repliedThread: useRepliedThreadData });
			expect(latestValue('repliedThread')).toEqual({ tmid: model.tmid, tmsg: model.tmsg, id: model.id });
		});

		it('useAvatar selects avatar and emoji', () => {
			const model = buildFakeModel({ avatar: 'avatar.png', emoji: ':smile:' });
			const { latestValue } = renderMessage(model, { avatar: useAvatar });
			expect(latestValue('avatar')).toEqual({ avatar: model.avatar, emoji: model.emoji });
		});

		it('useContentData selects the raw content fields', () => {
			const model = buildFakeModel();
			const { latestValue } = renderMessage(model, { content: useContentData });
			expect(latestValue('content')).toEqual({
				md: model.md,
				mentions: model.mentions,
				channels: model.channels,
				comment: model.comment,
				attachments: model.attachments,
				t: model.t
			});
		});
	});

	describe('granularity', () => {
		it('re-renders only the consumer of the field that changed', () => {
			const model = buildFakeModel();
			const { renderCount } = renderMessage(model, { reactions: useReactions, urls: useUrls });

			const reactionsBaseline = renderCount('reactions');
			const urlsBaseline = renderCount('urls');

			act(() => {
				(model as any).urls = [{ url: 'https://rocket.chat' }];
				model._emit();
			});

			expect(renderCount('urls')).toBeGreaterThan(urlsBaseline);
			expect(renderCount('reactions')).toBe(reactionsBaseline);
		});

		it('bails a multi-field (useShallow) consumer when an unrelated field changes', () => {
			const model = buildFakeModel();
			const { renderCount } = renderMessage(model, { author: useMessageAuthor, reactions: useReactions });

			const authorBaseline = renderCount('author');
			const reactionsBaseline = renderCount('reactions');

			act(() => {
				(model as any).reactions = [{ emoji: '🎉', usernames: ['bob'] }];
				model._emit();
			});

			expect(renderCount('reactions')).toBeGreaterThan(reactionsBaseline);
			expect(renderCount('author')).toBe(authorBaseline);
		});
	});

	describe('per-instance isolation', () => {
		it('keeps state independent across provider instances', () => {
			const modelA = buildFakeModel({ id: 'msg-a', msg: 'Model A' });
			const modelB = buildFakeModel({ id: 'msg-b', msg: 'Model B' });

			const spyA = jest.fn();
			const spyB = jest.fn();

			render(
				<>
					<MsgValueProbe item={modelA} spy={spyA} />
					<MsgValueProbe item={modelB} spy={spyB} />
				</>
			);

			expect(spyA).toHaveBeenLastCalledWith('Model A');
			expect(spyB).toHaveBeenLastCalledWith('Model B');

			act(() => {
				(modelA as any).msg = 'Model A updated';
				modelA._emit();
			});

			expect(spyA).toHaveBeenLastCalledWith('Model A updated');
			expect(spyB).toHaveBeenLastCalledWith('Model B');
		});
	});

	describe('derived hooks', () => {
		it('useMessageStatus returns hasError false and isTemp false for a normal model', () => {
			const model = buildFakeModel();
			const { latest } = renderDerived(model, useMessageStatus);
			expect(latest()).toEqual({ hasError: false, isTemp: false });
		});

		it('useMessageStatus returns hasError true and isTemp true for an ERROR status model', () => {
			const model = buildFakeModel({ status: messagesStatus.ERROR });
			const { latest } = renderDerived(model, useMessageStatus);
			expect(latest()).toEqual({ hasError: true, isTemp: true });
		});

		it('useMessageStatus returns hasError false and isTemp true for a TEMP status model', () => {
			const model = buildFakeModel({ status: messagesStatus.TEMP });
			const { latest } = renderDerived(model, useMessageStatus);
			expect(latest()).toEqual({ hasError: false, isTemp: true });
		});

		it('useIsEncrypted returns true for a pending e2e message', () => {
			const model = buildFakeModel({ t: E2E_MESSAGE_TYPE, e2e: 'pending' });
			const { latest } = renderDerived(model, useIsEncrypted);
			expect(latest()).toBe(true);
		});

		it('useIsEncrypted returns false for a done e2e message', () => {
			const model = buildFakeModel({ t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.DONE });
			const { latest } = renderDerived(model, useIsEncrypted);
			expect(latest()).toBe(false);
		});

		it('useIsEncrypted returns false for a plain text message', () => {
			const model = buildFakeModel();
			const { latest } = renderDerived(model, useIsEncrypted);
			expect(latest()).toBe(false);
		});

		it('useIsInfoMessage returns false for a discussion-created message', () => {
			const model = buildFakeModel({ t: 'discussion-created' });
			const { latest } = renderDerived(model, useIsInfoMessage);
			expect(latest()).toBe(false);
		});

		it('useIsInfoMessage returns true for an info message', () => {
			const model = buildFakeModel({ t: 'room_changed_topic' });
			const { latest } = renderDerived(model, useIsInfoMessage);
			expect(latest()).toBe(true);
		});

		it('useIsInfoMessage returns false for a default text message', () => {
			const model = buildFakeModel();
			const { latest } = renderDerived(model, useIsInfoMessage);
			expect(latest()).toBe(false);
		});

		it('useIsEdited returns false for a default model', () => {
			const model = buildFakeModel();
			const { latest } = renderDerived(model, useIsEdited);
			expect(latest()).toBe(false);
		});

		it('useIsEdited returns true for a model with editedBy', () => {
			const model = buildFakeModel({ editedBy: { _id: 'u2', username: 'bob' } });
			const { latest } = renderDerived(model, useIsEdited);
			expect(latest()).toBe(true);
		});

		it('useThreadPosition returns false/false when isThreadRoom is true', () => {
			const model = buildFakeModel({ tmid: 't1' });
			const { latest } = renderDerived(model, useThreadPosition, { config: { isThreadRoom: true } });
			expect(latest()).toEqual({ isThreadReply: false, isThreadSequential: false });
		});

		it('useThreadPosition returns isThreadReply true when the message replies to a different thread than prev', () => {
			const model = buildFakeModel({ tmid: 't1' });
			const { latest } = renderDerived(model, useThreadPosition, { previousItem: buildFakeModel({ id: 'p0', tmid: 't0' }) });
			expect(latest()).toEqual({ isThreadReply: true, isThreadSequential: true });
		});

		it('useThreadPosition returns isThreadReply false when prev is in the same thread', () => {
			const model = buildFakeModel({ tmid: 't1' });
			const { latest } = renderDerived(model, useThreadPosition, { previousItem: buildFakeModel({ id: 'p0', tmid: 't1' }) });
			expect(latest()).toEqual({ isThreadReply: false, isThreadSequential: true });
		});

		it('useMessageGrouping returns true (header) when there is no prev', () => {
			const model = buildFakeModel();
			const { latest } = renderDerived(model, useMessageGrouping);
			expect(latest()).toBe(true);
		});

		it('useMessageGrouping returns true (header) when prev has an ERROR status', () => {
			const model = buildFakeModel();
			const { latest } = renderDerived(model, useMessageGrouping, {
				previousItem: buildFakeModel({ id: 'p0', status: messagesStatus.ERROR })
			});
			expect(latest()).toBe(true);
		});

		it('useMessageGrouping returns false when prev matches author/day/period/thread', () => {
			const ts = new Date('2024-01-01T10:00:00Z');
			const prevTs = new Date('2024-01-01T09:59:50Z');
			const model = buildFakeModel({ ts, tmid: 't1' });
			const { latest } = renderDerived(model, useMessageGrouping, {
				previousItem: buildFakeModel({ id: 'p0', ts: prevTs, tmid: 't1' }),
				config: { broadcast: false, Message_GroupingPeriod: 300 }
			});
			expect(latest()).toBe(false);
		});

		it('useMessageGrouping returns true (header) when the room is broadcast, even if prev would otherwise group', () => {
			const ts = new Date('2024-01-01T10:00:00Z');
			const prevTs = new Date('2024-01-01T09:59:50Z');
			const model = buildFakeModel({ ts, tmid: 't1' });
			const { latest } = renderDerived(model, useMessageGrouping, {
				previousItem: buildFakeModel({ id: 'p0', ts: prevTs, tmid: 't1' }),
				config: { broadcast: true, Message_GroupingPeriod: 300 }
			});
			expect(latest()).toBe(true);
		});

		it('useMessageGrouping returns true (header) when groupable is false, even if prev would otherwise group', () => {
			const ts = new Date('2024-01-01T10:00:00Z');
			const prevTs = new Date('2024-01-01T09:59:50Z');
			const model = buildFakeModel({ ts, tmid: 't1', groupable: false });
			const { latest } = renderDerived(model, useMessageGrouping, {
				previousItem: buildFakeModel({ id: 'p0', ts: prevTs, tmid: 't1' }),
				config: { broadcast: false, Message_GroupingPeriod: 300 }
			});
			expect(latest()).toBe(true);
		});

		it('useMessageGrouping returns true (header) for a removed message, even if prev would otherwise group', () => {
			const ts = new Date('2024-01-01T10:00:00Z');
			const prevTs = new Date('2024-01-01T09:59:50Z');
			const model = buildFakeModel({ ts, tmid: 't1', t: 'rm' });
			const { latest } = renderDerived(model, useMessageGrouping, {
				previousItem: buildFakeModel({ id: 'p0', ts: prevTs, tmid: 't1' }),
				config: { broadcast: false, Message_GroupingPeriod: 300 }
			});
			expect(latest()).toBe(true);
		});

		it('flips to header when the previous message transitions to ERROR in place, without re-passing props', () => {
			const ts = new Date('2024-01-01T10:00:00Z');
			const prevTs = new Date('2024-01-01T09:59:50Z');
			const model = buildFakeModel({ ts, tmid: 't1' });
			const previousItem = buildFakeModel({ id: 'p0', ts: prevTs, tmid: 't1' });
			const { latest } = renderDerived(model, useMessageGrouping, {
				previousItem,
				config: { broadcast: false, Message_GroupingPeriod: 300 }
			});

			expect(latest()).toBe(false);

			act(() => {
				(previousItem as any).status = messagesStatus.ERROR;
				previousItem._emit();
			});

			expect(latest()).toBe(true);
		});

		it('unsubscribes the old previous model and subscribes the new one on a temp→server swap', () => {
			const ts = new Date('2024-01-01T10:00:00Z');
			const prevTs = new Date('2024-01-01T09:59:50Z');
			const item = buildFakeModel({ id: 'msg-1', ts, tmid: 't1' });
			const previousTemp = buildFakeModel({ id: 'p-temp', ts: prevTs, tmid: 't1' });
			const previousServer = buildFakeModel({ id: 'p-server', ts: prevTs, tmid: 't1' });

			const unsubscribeSpy = jest.fn();
			const realSubscribe = previousTemp.experimentalSubscribe.bind(previousTemp);
			previousTemp.experimentalSubscribe = ((cb: Subscriber) => {
				const realUnsub = realSubscribe(cb);
				return () => {
					unsubscribeSpy();
					realUnsub();
				};
			}) as FakeModel['experimentalSubscribe'];

			const spy = jest.fn();
			const Probe = () => {
				spy(useMessageGrouping());
				return null;
			};
			const latest = () => {
				const { calls } = spy.mock;
				return calls[calls.length - 1]?.[0];
			};
			const wrap = (previousItem: TAnyMessageModel) => (
				<Provider store={mockedStore}>
					<MessageRoomProvider broadcast={false} Message_GroupingPeriod={300}>
						<MessageProvider item={item} previousItem={previousItem}>
							<Probe />
						</MessageProvider>
					</MessageRoomProvider>
				</Provider>
			);

			const { rerender } = render(wrap(previousTemp));
			expect(latest()).toBe(false);
			expect(unsubscribeSpy).not.toHaveBeenCalled();

			act(() => rerender(wrap(previousServer)));
			expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
			expect(latest()).toBe(false);

			// An in-place change on the NEW previous model re-derives grouping, proving it is subscribed.
			act(() => {
				(previousServer as any).status = messagesStatus.ERROR;
				previousServer._emit();
			});
			expect(latest()).toBe(true);
		});

		it('useMessageText returns the raw message when there is no auto-translation', () => {
			const model = buildFakeModel();
			const { latest } = renderDerived(model, useMessageText);
			expect(latest()).toEqual({ messageText: model.msg, isTranslated: false });
		});

		it('useMessageText returns the translated message when auto-translate conditions are met', () => {
			const model = buildFakeModel({
				autoTranslate: true,
				translations: [{ _id: 't1', language: 'pt-BR', value: 'Olá mundo' }],
				u: { _id: 'u2', username: 'bob' }
			});
			const { latest } = renderDerived(model, useMessageText, {
				config: { autoTranslateRoom: true, autoTranslateLanguage: 'pt-BR', user: { username: 'alice' } }
			});
			expect(latest()).toEqual({ messageText: 'Olá mundo', isTranslated: true });
		});

		it('useMessageHeaderMeta returns ts, unread, pinned and t', () => {
			const ts = new Date('2024-01-01T10:00:00Z');
			const model = buildFakeModel({ ts, unread: true, pinned: true, t: 'room_changed_topic' });
			const { latest } = renderDerived(model, useMessageHeaderMeta);
			expect(latest()).toEqual({ ts: model.ts, unread: model.unread, pinned: model.pinned, t: model.t });
		});
	});

	describe('outside a MessageProvider', () => {
		let consoleErrorSpy: jest.SpyInstance;

		beforeEach(() => {
			consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			consoleErrorSpy.mockRestore();
		});

		it('useMessageItem throws', () => {
			const Probe = () => {
				useMessageItem();
				return null;
			};
			expect(() => render(<Probe />)).toThrow('Message hooks must be used within a MessageProvider');
		});

		it('useMessageField throws', () => {
			const Probe = () => {
				useReactions();
				return null;
			};
			expect(() => render(<Probe />)).toThrow('Message hooks must be used within a MessageProvider');
		});
	});

	describe('ignored messages', () => {
		it('useMessageIgnored reflects the isIgnored seed', () => {
			const model = buildFakeModel();
			const ignoredSpy = jest.fn();
			const notIgnoredSpy = jest.fn();
			const IgnoredProbe = () => {
				ignoredSpy(useMessageIgnored());
				return null;
			};
			const NotIgnoredProbe = () => {
				notIgnoredSpy(useMessageIgnored());
				return null;
			};

			render(
				<MessageProvider item={model} isIgnored>
					<IgnoredProbe />
				</MessageProvider>
			);
			render(
				<MessageProvider item={model}>
					<NotIgnoredProbe />
				</MessageProvider>
			);

			expect(ignoredSpy).toHaveBeenLastCalledWith(true);
			expect(notIgnoredSpy).toHaveBeenLastCalledWith(false);
		});

		it('revealIgnored flips useMessageIgnored to false and stays revealed across re-renders', () => {
			const model = buildFakeModel();
			const spy = jest.fn();
			const Probe = () => {
				spy(useMessageIgnored());
				const reveal = useRevealIgnored();
				return <Text testID='reveal' onPress={reveal} />;
			};
			const wrap = () => (
				<MessageProvider item={model} isIgnored>
					<Probe />
				</MessageProvider>
			);

			const { rerender, getByTestId } = render(wrap());
			expect(spy).toHaveBeenLastCalledWith(true);

			fireEvent.press(getByTestId('reveal'));
			expect(spy).toHaveBeenLastCalledWith(false);

			// The reset effect is keyed on isIgnored; a re-render with the same seed does not re-run it, so the reveal sticks.
			act(() => rerender(wrap()));
			expect(spy).toHaveBeenLastCalledWith(false);
		});

		it('re-hides after the ignore state transitions away and back', () => {
			const model = buildFakeModel();
			const spy = jest.fn();
			const Probe = () => {
				spy(useMessageIgnored());
				const reveal = useRevealIgnored();
				return <Text testID='reveal' onPress={reveal} />;
			};
			const wrap = (ignored: boolean) => (
				<MessageProvider item={model} isIgnored={ignored}>
					<Probe />
				</MessageProvider>
			);

			const { rerender, getByTestId } = render(wrap(true));
			expect(spy).toHaveBeenLastCalledWith(true);

			fireEvent.press(getByTestId('reveal'));
			expect(spy).toHaveBeenLastCalledWith(false);

			act(() => rerender(wrap(false)));
			expect(spy).toHaveBeenLastCalledWith(false);

			act(() => rerender(wrap(true)));
			expect(spy).toHaveBeenLastCalledWith(true);
		});
	});

	describe('useOnLinkPress', () => {
		beforeEach(() => {
			mockOpenLink.mockClear();
		});

		it('jumps to the message when the link matches an attachment message_link', () => {
			const jumpToMessage = jest.fn();
			const link = 'https://example.com/msg-link';
			const model = buildFakeModel({ attachments: [{ message_link: link } as IAttachment] });
			const { result } = renderHook(() => useOnLinkPress(), { wrapper: wrapWithProviders(model, { jumpToMessage }) });

			result.current(link);

			expect(jumpToMessage).toHaveBeenCalledWith(link);
			expect(mockOpenLink).not.toHaveBeenCalled();
		});

		it('opens the link when it does not match any attachment message_link', () => {
			const jumpToMessage = jest.fn();
			const link = 'https://example.com/other';
			const model = buildFakeModel({ attachments: [{ message_link: 'https://example.com/msg-link' } as IAttachment] });
			const { result } = renderHook(() => useOnLinkPress(), { wrapper: wrapWithProviders(model, { jumpToMessage }) });

			result.current(link);

			expect(jumpToMessage).not.toHaveBeenCalled();
			expect(mockOpenLink).toHaveBeenCalledWith(link, 'light');
		});

		it('does not jump when attachments is undefined', () => {
			const jumpToMessage = jest.fn();
			const link = 'https://example.com/msg-link';
			const model = buildFakeModel({ attachments: undefined });
			const { result } = renderHook(() => useOnLinkPress(), { wrapper: wrapWithProviders(model, { jumpToMessage }) });

			result.current(link);

			expect(jumpToMessage).not.toHaveBeenCalled();
			expect(mockOpenLink).toHaveBeenCalledWith(link, 'light');
		});
	});

	describe('useMessageTouchable', () => {
		it('is fully tappable and long-pressable for a plain text message', () => {
			const model = buildFakeModel();
			const { result } = renderMessageHook(useMessageTouchable, model);
			expect(result.current).toEqual({ tappable: true, longPressable: true, revealsIgnored: false });
		});

		it('is untouchable for an info message', () => {
			const model = buildFakeModel({ t: 'room_changed_topic' });
			const { result } = renderMessageHook(useMessageTouchable, model);
			expect(result.current).toEqual({ tappable: false, longPressable: false, revealsIgnored: false });
		});

		it('is untouchable when the message has an error status', () => {
			const model = buildFakeModel({ status: messagesStatus.ERROR });
			const { result } = renderMessageHook(useMessageTouchable, model);
			expect(result.current).toEqual({ tappable: false, longPressable: false, revealsIgnored: false });
		});

		it('is untouchable when the room is archived', () => {
			const model = buildFakeModel();
			const { result } = renderMessageHook(useMessageTouchable, model, { config: { archived: true } });
			expect(result.current).toEqual({ tappable: false, longPressable: false, revealsIgnored: false });
		});

		// Post-refactor: tappable now also excludes isTemp, so a still-sending message loses both
		// tap and long-press here — the old long-press guard only checked isInfo/hasError/isEncrypted/archived.
		it('is untouchable while the message is temp (sending)', () => {
			const model = buildFakeModel({ status: messagesStatus.TEMP });
			const { result } = renderMessageHook(useMessageTouchable, model);
			expect(result.current).toEqual({ tappable: false, longPressable: false, revealsIgnored: false });
		});

		// Post-refactor: tappable now also excludes jitsi_call_started, which the old long-press guard did not.
		it('is untouchable for a jitsi_call_started message', () => {
			const model = buildFakeModel({ t: 'jitsi_call_started' });
			const { result } = renderMessageHook(useMessageTouchable, model);
			expect(result.current).toEqual({ tappable: false, longPressable: false, revealsIgnored: false });
		});

		it('is tappable but not long-pressable for a pending encrypted message', () => {
			const model = buildFakeModel({ t: E2E_MESSAGE_TYPE, e2e: 'pending' });
			const { result } = renderMessageHook(useMessageTouchable, model);
			expect(result.current).toEqual({ tappable: true, longPressable: false, revealsIgnored: false });
		});

		it('reveals ignored on an otherwise-tappable ignored message', () => {
			const model = buildFakeModel();
			const { result } = renderMessageHook(useMessageTouchable, model, { isIgnored: true });
			expect(result.current).toEqual({ tappable: true, longPressable: true, revealsIgnored: true });
		});

		it('does not reveal ignored when the message is not tappable', () => {
			const model = buildFakeModel();
			const { result } = renderMessageHook(useMessageTouchable, model, { isIgnored: true, config: { archived: true } });
			expect(result.current).toEqual({ tappable: false, longPressable: false, revealsIgnored: false });
		});
	});

	describe('useMessageLongPress', () => {
		it('fires onLongPress with the item when longPressable', () => {
			const model = buildFakeModel();
			const onLongPress = jest.fn();
			const { result } = renderMessageHook(useMessageLongPress, model, { onLongPress });

			act(() => result.current());

			expect(onLongPress).toHaveBeenCalledWith(model);
		});

		it('does not fire onLongPress for an info message', () => {
			const model = buildFakeModel({ t: 'room_changed_topic' });
			const onLongPress = jest.fn();
			const { result } = renderMessageHook(useMessageLongPress, model, { onLongPress });

			act(() => result.current());

			expect(onLongPress).not.toHaveBeenCalled();
		});

		it('does not fire onLongPress for an encrypted message', () => {
			const model = buildFakeModel({ t: E2E_MESSAGE_TYPE, e2e: 'pending' });
			const onLongPress = jest.fn();
			const { result } = renderMessageHook(useMessageLongPress, model, { onLongPress });

			act(() => result.current());

			expect(onLongPress).not.toHaveBeenCalled();
		});

		// See useMessageTouchable above: this suppression is new vs the pre-refactor guard.
		it('does not fire onLongPress on a temp (sending) message', () => {
			const model = buildFakeModel({ status: messagesStatus.TEMP });
			const onLongPress = jest.fn();
			const { result } = renderMessageHook(useMessageLongPress, model, { onLongPress });

			act(() => result.current());

			expect(onLongPress).not.toHaveBeenCalled();
		});

		it('does not fire onLongPress on a jitsi_call_started message', () => {
			const model = buildFakeModel({ t: 'jitsi_call_started' });
			const onLongPress = jest.fn();
			const { result } = renderMessageHook(useMessageLongPress, model, { onLongPress });

			act(() => result.current());

			expect(onLongPress).not.toHaveBeenCalled();
		});
	});

	describe('useMessagePress', () => {
		let dismissSpy: jest.SpyInstance;

		beforeEach(() => {
			jest.useFakeTimers();
			dismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
		});

		afterEach(() => {
			dismissSpy.mockRestore();
			jest.useRealTimers();
		});

		it('reveals an ignored message instead of pressing', () => {
			const model = buildFakeModel({ tmid: 't1' });
			const onThreadPress = jest.fn();
			const { result } = renderMessageHook(useMessagePress, model, { isIgnored: true, config: { handlers: { onThreadPress } } });

			act(() => result.current());

			expect(dismissSpy).not.toHaveBeenCalled();
			expect(onThreadPress).not.toHaveBeenCalled();
		});

		it('calls the row onPress handler and skips keyboard dismiss and thread/discussion routing', () => {
			const model = buildFakeModel({ tmid: 't1', dlm: new Date(), drid: 'drid-1' });
			const onPress = jest.fn();
			const onThreadPress = jest.fn();
			const onDiscussionPress = jest.fn();
			const { result } = renderMessageHook(useMessagePress, model, {
				onPress,
				config: { handlers: { onThreadPress, onDiscussionPress } }
			});

			act(() => result.current());

			expect(onPress).toHaveBeenCalledTimes(1);
			expect(dismissSpy).not.toHaveBeenCalled();
			expect(onThreadPress).not.toHaveBeenCalled();
			expect(onDiscussionPress).not.toHaveBeenCalled();
		});

		it('dismisses the keyboard and routes to thread press for a threaded reply', () => {
			const model = buildFakeModel({ tmid: 't1' });
			const onThreadPress = jest.fn();
			const { result } = renderMessageHook(useMessagePress, model, { config: { handlers: { onThreadPress } } });

			act(() => result.current());

			expect(dismissSpy).toHaveBeenCalledTimes(1);
			expect(onThreadPress).toHaveBeenCalledWith(model);
		});

		it('routes to thread press for a root message that has replies (tlm)', () => {
			const model = buildFakeModel({ tlm: new Date() });
			const onThreadPress = jest.fn();
			const { result } = renderMessageHook(useMessagePress, model, { config: { handlers: { onThreadPress } } });

			act(() => result.current());

			expect(onThreadPress).toHaveBeenCalledWith(model);
		});

		it('does not route to thread press while already inside the thread room', () => {
			const model = buildFakeModel({ tmid: 't1' });
			const onThreadPress = jest.fn();
			const { result } = renderMessageHook(useMessagePress, model, {
				config: { isThreadRoom: true, handlers: { onThreadPress } }
			});

			act(() => result.current());

			expect(onThreadPress).not.toHaveBeenCalled();
		});

		it('routes to discussion press when the message has a discussion', () => {
			const model = buildFakeModel({ dlm: new Date(), drid: 'drid-1' });
			const onDiscussionPress = jest.fn();
			const { result } = renderMessageHook(useMessagePress, model, { config: { handlers: { onDiscussionPress } } });

			act(() => result.current());

			expect(onDiscussionPress).toHaveBeenCalledWith('drid-1');
		});

		it('debounces on the leading edge, suppressing an immediate repeat until the window elapses', () => {
			const model = buildFakeModel({ tmid: 't1' });
			const onThreadPress = jest.fn();
			const { result } = renderMessageHook(useMessagePress, model, { config: { handlers: { onThreadPress } } });

			act(() => result.current());
			expect(onThreadPress).toHaveBeenCalledTimes(1);

			act(() => result.current());
			expect(onThreadPress).toHaveBeenCalledTimes(1);

			act(() => jest.advanceTimersByTime(300));

			act(() => result.current());
			expect(onThreadPress).toHaveBeenCalledTimes(2);
		});

		it('routes the debounced press through closeEmojiAndAction instead of running it directly', () => {
			const model = buildFakeModel({ tmid: 't1' });
			const onThreadPress = jest.fn();
			const closeEmojiAndAction = jest.fn();
			const { result } = renderMessageHook(useMessagePress, model, {
				config: { closeEmojiAndAction, handlers: { onThreadPress } }
			});

			act(() => result.current());

			expect(closeEmojiAndAction).toHaveBeenCalledWith(expect.any(Function));
			expect(dismissSpy).not.toHaveBeenCalled();
			expect(onThreadPress).not.toHaveBeenCalled();
		});

		it('runs the gated press once closeEmojiAndAction invokes the handler it was given', () => {
			const model = buildFakeModel({ tmid: 't1' });
			const onThreadPress = jest.fn();
			const closeEmojiAndAction = jest.fn((action?: (params?: unknown) => void) => action?.());
			const { result } = renderMessageHook(useMessagePress, model, {
				config: { closeEmojiAndAction, handlers: { onThreadPress } }
			});

			act(() => result.current());

			expect(dismissSpy).toHaveBeenCalledTimes(1);
			expect(onThreadPress).toHaveBeenCalledWith(model);
		});
	});

	describe('translation boundary on item.autoTranslate', () => {
		const translationConfig = { autoTranslateRoom: true, autoTranslateLanguage: 'pt-BR', user: { username: 'alice' } };

		it('useTranslateLanguage returns undefined when autoTranslate is undefined', () => {
			const model = buildFakeModel({ autoTranslate: undefined, u: { _id: 'u2', username: 'bob' } });
			const { latest } = renderDerived(model, useTranslateLanguage, { config: translationConfig });
			expect(latest()).toBeUndefined();
		});

		it('useTranslateLanguage returns the language when autoTranslate is true', () => {
			const model = buildFakeModel({ autoTranslate: true, u: { _id: 'u2', username: 'bob' } });
			const { latest } = renderDerived(model, useTranslateLanguage, { config: translationConfig });
			expect(latest()).toBe('pt-BR');
		});

		it('useTranslateLanguage returns undefined when autoTranslate is false', () => {
			const model = buildFakeModel({ autoTranslate: false, u: { _id: 'u2', username: 'bob' } });
			const { latest } = renderDerived(model, useTranslateLanguage, { config: translationConfig });
			expect(latest()).toBeUndefined();
		});

		it('useMessageText does not translate when autoTranslate is undefined, even in an auto-translating room', () => {
			const model = buildFakeModel({
				autoTranslate: undefined,
				translations: [{ _id: 't1', language: 'pt-BR', value: 'Olá mundo' }],
				u: { _id: 'u2', username: 'bob' }
			});
			const { latest } = renderDerived(model, useMessageText, { config: translationConfig });
			expect(latest()).toEqual({ messageText: model.msg, isTranslated: false });
		});

		it('useMessageText translates when autoTranslate is true', () => {
			const model = buildFakeModel({
				autoTranslate: true,
				translations: [{ _id: 't1', language: 'pt-BR', value: 'Olá mundo' }],
				u: { _id: 'u2', username: 'bob' }
			});
			const { latest } = renderDerived(model, useMessageText, { config: translationConfig });
			expect(latest()).toEqual({ messageText: 'Olá mundo', isTranslated: true });
		});

		it('useMessageText does not translate when autoTranslate is false', () => {
			const model = buildFakeModel({
				autoTranslate: false,
				translations: [{ _id: 't1', language: 'pt-BR', value: 'Olá mundo' }],
				u: { _id: 'u2', username: 'bob' }
			});
			const { latest } = renderDerived(model, useMessageText, { config: translationConfig });
			expect(latest()).toEqual({ messageText: model.msg, isTranslated: false });
		});
	});

	describe('useMessageField misuse guard (dev)', () => {
		let warnSpy: jest.SpyInstance;

		beforeEach(() => {
			warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
		});

		afterEach(() => {
			warnSpy.mockRestore();
		});

		// A selector that returns a fresh object on every call never lets React's useSyncExternalStore
		// snapshot settle, so this misuse also trips React's own update-depth guard. The dev warning
		// still fires (once) before that crash, which is what this test asserts.
		it('warns when the selector returns a new object every call for unchanged data', () => {
			const model = buildFakeModel();

			expect(() => {
				renderMessageHook(() => useMessageField(item => ({ id: item.id })), model);
			}).toThrow('Maximum update depth exceeded');

			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[MessageStore] useMessageField selector'));
		});

		it('does not warn for a primitive field selector', () => {
			const model = buildFakeModel();
			renderMessageHook(() => useMessageField(item => item.id), model);

			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('does not warn for a memoized object field selector (stable reference across calls)', () => {
			const model = buildFakeModel();
			renderMessageHook(() => useMessageField(item => item.reactions), model);

			expect(warnSpy).not.toHaveBeenCalled();
		});
	});
});
