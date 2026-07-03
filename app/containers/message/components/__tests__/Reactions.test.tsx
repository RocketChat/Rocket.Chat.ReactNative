import { render, fireEvent } from '@testing-library/react-native';

import Reactions from '../Reactions';
import { MessageProviders } from '../../testHelpers';
import { setUser } from '../../../../actions/login';
import { mockedStore } from '../../../../reducers/mockedStore';
import { type IReaction, type TAnyMessageModel } from '../../../../definitions';

const initialMockedStoreState = () => {
	mockedStore.dispatch(
		setUser({
			settings: {
				preferences: {
					convertAsciiEmoji: true
				}
			}
		})
	);
};

initialMockedStoreState();

const getCustomEmoji = jest.fn();

type FakeItem = TAnyMessageModel & { reactions: IReaction[]; _emit: () => void };

// Mirrors the MessageStore.test.tsx fake-model pattern: a stable item mutated in place,
// with experimentalSubscribe/_emit standing in for WatermelonDB's reactivity.
const buildItem = (reactions: IReaction[]): FakeItem => {
	const subscribers: Array<() => void> = [];
	return {
		id: 'msg-1',
		reactions,
		experimentalSubscribe(cb: () => void) {
			subscribers.push(cb);
			return () => {
				const idx = subscribers.indexOf(cb);
				if (idx !== -1) subscribers.splice(idx, 1);
			};
		},
		_emit() {
			subscribers.forEach(cb => cb());
		}
	} as unknown as FakeItem;
};

// onReactionPress is built outside the component (test scope) and mutates `item` in
// place, mirroring how a real WatermelonDB write would be observed via experimentalSubscribe.
const buildOnReactionPress = (item: FakeItem) => (emoji: string) => {
	item.reactions = item.reactions.filter(r => r.emoji !== emoji);
	item._emit();
};

const TestWrapper = ({ item, onReactionPress }: { item: FakeItem; onReactionPress: (emoji: string) => void }) => (
	<MessageProviders
		item={item}
		context={{
			user: { username: 'john' },
			reactionInit: jest.fn(),
			onReactionPress,
			onReactionLongPress: jest.fn(),
			getCustomEmoji
		}}>
		<Reactions />
	</MessageProviders>
);

it('renders all reactions and AddReaction button', () => {
	const reactions: IReaction[] = [
		{ _id: '1', emoji: '👍', usernames: ['john', 'alice'], names: [] },
		{ _id: '2', emoji: '😂', usernames: ['bob'], names: [] }
	];
	const item = buildItem(reactions);

	const { getByTestId } = render(<TestWrapper item={item} onReactionPress={buildOnReactionPress(item)} />);

	expect(getByTestId('message-reaction-👍')).toBeTruthy();
	expect(getByTestId('message-reaction-😂')).toBeTruthy();
	expect(getByTestId('message-add-reaction')).toBeTruthy();
});

it('should render unicode emoji reaction', () => {
	const reactions = [{ _id: '1', emoji: ':)', usernames: ['john', 'alice'], names: [] }];
	const item = buildItem(reactions);

	const { getByTestId } = render(<TestWrapper item={item} onReactionPress={buildOnReactionPress(item)} />);

	expect(getByTestId('message-reaction-:)')).toBeTruthy();
	expect(getByTestId('message-add-reaction')).toBeTruthy();
});

it('should render custom emoji reaction', () => {
	const reactions = [{ _id: '1', emoji: ':aaaaa:', usernames: ['john', 'alice'], names: [] }];
	const item = buildItem(reactions);

	const { getByTestId } = render(<TestWrapper item={item} onReactionPress={buildOnReactionPress(item)} />);

	expect(getByTestId('message-reaction-:aaaaa:')).toBeTruthy();
	expect(getByTestId('message-add-reaction')).toBeTruthy();
});

it('should remove reaction', () => {
	const reactions = [
		{ _id: '1', emoji: ':thumbsup:', usernames: ['john'], names: [] },
		{ _id: '1', emoji: ':heart_eyes:', usernames: ['john', 'alice'], names: [] }
	];
	const item = buildItem(reactions);

	const { getByTestId, queryByTestId } = render(<TestWrapper item={item} onReactionPress={buildOnReactionPress(item)} />);

	expect(getByTestId('message-reaction-:thumbsup:')).toBeTruthy();
	expect(getByTestId('message-reaction-:heart_eyes:')).toBeTruthy();
	fireEvent.press(getByTestId('message-reaction-:thumbsup:'));
	expect(queryByTestId('message-reaction-:thumbsup:')).toBeNull();
	expect(getByTestId('message-add-reaction')).toBeTruthy();
});
