import { act, render } from '@testing-library/react-native';

import { type IShareAttachment } from '../../../definitions';
import { MessageComposerContainer } from '../MessageComposerContainer';
import { useRoomWithUpdate } from '../../../lib/store/RoomStoreContext';
import {
	ComposerStoreProvider,
	useAlsoSendThreadToChannel,
	useAutocompleteParams,
	useComposerAttachments,
	useComposerTmid,
	useEditCancel,
	useFocused,
	useMessageComposerApi,
	useMicOrSend,
	useOnRemoveQuoteMessage,
	useOnSendMessage,
	useEditRequest,
	useRecordingAudio,
	useShowMarkdownToolbar
} from '../store';

type Api = ReturnType<typeof useMessageComposerApi>;

const renderComposer = (probes: Record<string, () => unknown>) => {
	const probeSpies: Record<string, jest.Mock> = {};
	const apiSpy = jest.fn();

	const probeElements = Object.entries(probes).map(([name, useHook]) => {
		const spy = jest.fn();
		probeSpies[name] = spy;
		const Probe = () => {
			spy(useHook());
			return null;
		};
		return <Probe key={name} />;
	});

	const ApiProbe = () => {
		apiSpy(useMessageComposerApi());
		return null;
	};

	render(
		<ComposerStoreProvider>
			<>
				{probeElements}
				<ApiProbe />
			</>
		</ComposerStoreProvider>
	);

	const renderCount = (name: string) => probeSpies[name].mock.calls.length;
	const latestValue = (name: string) => {
		const { calls } = probeSpies[name].mock;
		return calls[calls.length - 1]?.[0];
	};

	const [[api]] = apiSpy.mock.calls as [Api][];
	return { api, renderCount, latestValue };
};

const attachment = (path: string, extra?: Partial<IShareAttachment>): IShareAttachment => ({
	filename: `${path}.png`,
	size: 1,
	path,
	...extra
});

type ScalarCase = {
	name: string;
	useHook: () => unknown;
	initial: unknown;
	mutate: (api: Api) => void;
	next: unknown;
};

const SCALAR_SLICES: ScalarCase[] = [
	{ name: 'focused', useHook: useFocused, initial: false, mutate: api => api.setFocused(true), next: true },
	{ name: 'micOrSend', useHook: useMicOrSend, initial: 'mic', mutate: api => api.setMicOrSend('send'), next: 'send' },
	{
		name: 'showMarkdownToolbar',
		useHook: useShowMarkdownToolbar,
		initial: false,
		mutate: api => api.setMarkdownToolbar(true),
		next: true
	},
	{
		name: 'alsoSendThreadToChannel',
		useHook: useAlsoSendThreadToChannel,
		initial: false,
		mutate: api => api.setAlsoSendThreadToChannel(true),
		next: true
	},
	{ name: 'recordingAudio', useHook: useRecordingAudio, initial: false, mutate: api => api.setRecordingAudio(true), next: true },
	{
		name: 'autocompleteParams',
		useHook: useAutocompleteParams,
		initial: { text: '', type: null },
		mutate: api => api.setAutocompleteParams({ text: '@ro', type: '@' }),
		next: { text: '@ro', type: '@' }
	}
];

describe('MessageComposer state container', () => {
	it('throws without a room provider', () => {
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
		const Probe = () => {
			useRoomWithUpdate();
			return null;
		};

		expect(() => render(<MessageComposerContainer render={() => <Probe />} />)).toThrow(
			'Room store hooks must be used within a RoomStoreContext.Provider'
		);
		consoleError.mockRestore();
	});

	describe('per-instance isolation', () => {
		it('keeps channel and thread state independent', () => {
			const spyA = jest.fn();
			const spyB = jest.fn();

			const Probe = ({ spy }: { spy: jest.Mock }) => {
				spy({ focused: useFocused(), tmid: useComposerTmid(), api: useMessageComposerApi() });
				return null;
			};

			render(
				<>
					<MessageComposerContainer render={() => <Probe spy={spyA} />} />
					<MessageComposerContainer tmid='thread-id' render={() => <Probe spy={spyB} />} />
				</>
			);

			const latest = (spy: jest.Mock): { focused: boolean; tmid?: string; api: Api } =>
				spy.mock.calls[spy.mock.calls.length - 1][0];

			expect(latest(spyA).focused).toBe(false);
			expect(latest(spyA).tmid).toBeUndefined();
			expect(latest(spyB).focused).toBe(false);
			expect(latest(spyB).tmid).toBe('thread-id');

			act(() => latest(spyA).api.setFocused(true));

			expect(latest(spyA).focused).toBe(true);
			expect(latest(spyB).focused).toBe(false);

			act(() => latest(spyB).api.setRecordingAudio(true));

			expect(latest(spyA).focused).toBe(true);
		});
	});

	it('uses the latest host callbacks without replacing the store', async () => {
		const firstCallbacks = {
			onSendMessage: jest.fn(),
			editRequest: jest.fn(() => Promise.resolve()),
			editCancel: jest.fn(),
			onRemoveQuoteMessage: jest.fn()
		};
		const latestCallbacks = {
			onSendMessage: jest.fn(),
			editRequest: jest.fn(() => Promise.resolve()),
			editCancel: jest.fn(),
			onRemoveQuoteMessage: jest.fn()
		};
		let callbacks: {
			onSendMessage: ReturnType<typeof useOnSendMessage>;
			editRequest: ReturnType<typeof useEditRequest>;
			editCancel: ReturnType<typeof useEditCancel>;
			onRemoveQuoteMessage: ReturnType<typeof useOnRemoveQuoteMessage>;
		};

		const Probe = () => {
			callbacks = {
				onSendMessage: useOnSendMessage(),
				editRequest: useEditRequest(),
				editCancel: useEditCancel(),
				onRemoveQuoteMessage: useOnRemoveQuoteMessage()
			};
			return null;
		};
		const Host = ({ currentCallbacks }: { currentCallbacks: typeof firstCallbacks }) => (
			<MessageComposerContainer {...currentCallbacks} render={() => <Probe />} />
		);

		const { rerender } = render(<Host currentCallbacks={firstCallbacks} />);
		rerender(<Host currentCallbacks={latestCallbacks} />);

		callbacks!.onSendMessage('hello', true);
		await callbacks!.editRequest({ id: 'message-id', rid: 'room-id', msg: 'edited' });
		callbacks!.editCancel();
		callbacks!.onRemoveQuoteMessage('message-id');

		expect(firstCallbacks.onSendMessage).not.toHaveBeenCalled();
		expect(firstCallbacks.editRequest).not.toHaveBeenCalled();
		expect(firstCallbacks.editCancel).not.toHaveBeenCalled();
		expect(firstCallbacks.onRemoveQuoteMessage).not.toHaveBeenCalled();
		expect(latestCallbacks.onSendMessage).toHaveBeenCalledWith('hello', true);
		expect(latestCallbacks.editRequest).toHaveBeenCalledWith({ id: 'message-id', rid: 'room-id', msg: 'edited' });
		expect(latestCallbacks.editCancel).toHaveBeenCalledTimes(1);
		expect(latestCallbacks.onRemoveQuoteMessage).toHaveBeenCalledWith('message-id');
	});

	describe('scalar slices', () => {
		describe.each(SCALAR_SLICES)('$name', ({ name, useHook, initial, mutate, next }) => {
			it('exposes the initial value, then reflects the update (set→read)', () => {
				const { api, latestValue } = renderComposer({ [name]: useHook });

				expect(latestValue(name)).toEqual(initial);

				act(() => mutate(api));

				expect(latestValue(name)).toEqual(next);
			});

			it('re-renders its own consumer but not an unrelated one when it changes (granularity)', () => {
				const { api, renderCount } = renderComposer({ [name]: useHook, attachments: useComposerAttachments });

				const sliceBaseline = renderCount(name);
				const controlBaseline = renderCount('attachments');

				act(() => mutate(api));

				expect(renderCount(name)).toBeGreaterThan(sliceBaseline);
				expect(renderCount('attachments')).toBe(controlBaseline);
			});
		});
	});

	describe('attachments', () => {
		it('add appends attachments in order', () => {
			const { api, latestValue } = renderComposer({ attachments: useComposerAttachments });

			expect(latestValue('attachments')).toEqual([]);

			act(() => api.addAttachments([attachment('a')]));
			act(() => api.addAttachments([attachment('b')]));

			expect((latestValue('attachments') as IShareAttachment[]).map(a => a.path)).toEqual(['a', 'b']);
		});

		it('update merges a patch into the matching attachment by path, leaving others untouched', () => {
			const { api, latestValue } = renderComposer({ attachments: useComposerAttachments });

			act(() => api.addAttachments([attachment('a'), attachment('b')]));
			act(() => api.updateAttachment('a', { description: 'hello' }));

			const result = latestValue('attachments') as IShareAttachment[];
			expect(result.find(a => a.path === 'a')).toMatchObject({ path: 'a', filename: 'a.png', description: 'hello' });
			expect(result.find(a => a.path === 'b')?.description).toBeUndefined();
		});

		it('remove filters out the attachment with the matching path', () => {
			const { api, latestValue } = renderComposer({ attachments: useComposerAttachments });

			act(() => api.addAttachments([attachment('a'), attachment('b')]));
			act(() => api.removeAttachment('a'));

			expect((latestValue('attachments') as IShareAttachment[]).map(a => a.path)).toEqual(['b']);
		});

		it('clear empties the attachments', () => {
			const { api, latestValue } = renderComposer({ attachments: useComposerAttachments });

			act(() => api.addAttachments([attachment('a'), attachment('b')]));
			act(() => api.clearAttachments());

			expect(latestValue('attachments')).toEqual([]);
		});

		it('does not re-render a scalar consumer when attachments change', () => {
			const { api, renderCount } = renderComposer({ attachments: useComposerAttachments, focused: useFocused });

			const attachmentsBaseline = renderCount('attachments');
			const focusedBaseline = renderCount('focused');

			act(() => api.addAttachments([attachment('a')]));

			expect(renderCount('attachments')).toBeGreaterThan(attachmentsBaseline);
			expect(renderCount('focused')).toBe(focusedBaseline);
		});
	});

	describe('actions reference stability', () => {
		it('keeps the same api reference across slice updates', () => {
			const probe = jest.fn();

			const Probe = () => {
				useFocused();
				probe(useMessageComposerApi());
				return null;
			};

			render(
				<ComposerStoreProvider>
					<Probe />
				</ComposerStoreProvider>
			);

			const callsBefore = probe.mock.calls.length;
			const ref1: Api = probe.mock.calls[callsBefore - 1][0];

			act(() => ref1.setFocused(true));

			expect(probe.mock.calls.length).toBeGreaterThan(callsBefore);
			const ref2: Api = probe.mock.calls[probe.mock.calls.length - 1][0];
			expect(ref2).toBe(ref1);
		});
	});
});
