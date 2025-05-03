import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { render, fireEvent } from '@testing-library/react-native';

import Reactions from './Reactions';
import MessageContext from './Context';
import { setUser } from '../../actions/login';
import { mockedStore } from '../../reducers/mockedStore';
import { IReaction } from '../../definitions';

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

const TestWrapper = ({ initialReactions }: { initialReactions: IReaction[] }) => {
	const [reactions, setReactions] = useState<IReaction[]>(initialReactions);
	const handleReactionPress = (emoji: string) => {
		setReactions(prev => prev.filter(r => r.emoji !== emoji));
	};

	return (
		<Provider store={mockedStore}>
			<MessageContext.Provider
				value={{
					user: { username: 'john' },
					reactionInit: jest.fn(),
					onReactionPress: handleReactionPress,
					onReactionLongPress: jest.fn()
				}}>
				<Reactions reactions={reactions} getCustomEmoji={getCustomEmoji} />
			</MessageContext.Provider>
		</Provider>
	);
};

const getCustomEmoji = jest.fn();

it('renders all reactions and AddReaction button', () => {
	const reactions: IReaction[] = [
		{ _id: '1', emoji: '👍', usernames: ['john', 'alice'], names: [] },
		{ _id: '2', emoji: '😂', usernames: ['bob'], names: [] }
	];

	const { getByTestId } = render(<TestWrapper initialReactions={reactions} />);

	expect(getByTestId('message-reaction-👍')).toBeTruthy();
	expect(getByTestId('message-reaction-😂')).toBeTruthy();
	expect(getByTestId('message-add-reaction')).toBeTruthy();
});

it('should render unicode emoji reaction', () => {
	const reactions = [{ _id: '1', emoji: ':)', usernames: ['john', 'alice'], names: [] }];
	const { getByTestId } = render(<TestWrapper initialReactions={reactions} />);

	expect(getByTestId('message-reaction-:)')).toBeTruthy();
	expect(getByTestId('message-add-reaction')).toBeTruthy();
});

it('should render custom emoji reaction', () => {
	const reactions = [{ _id: '1', emoji: ':aaaaa:', usernames: ['john', 'alice'], names: [] }];
	const { getByTestId } = render(<TestWrapper initialReactions={reactions} />);

	expect(getByTestId('message-reaction-:aaaaa:')).toBeTruthy();
	expect(getByTestId('message-add-reaction')).toBeTruthy();
});

it('should remove reaction', () => {
	const reactions = [
		{ _id: '1', emoji: ':thumbsup:', usernames: ['john'], names: [] },
		{ _id: '1', emoji: ':heart_eyes:', usernames: ['john', 'alice'], names: [] }
	];
	const { getByTestId, queryByTestId } = render(<TestWrapper initialReactions={reactions} />);

	expect(getByTestId('message-reaction-:thumbsup:')).toBeTruthy();
	expect(getByTestId('message-reaction-:heart_eyes:')).toBeTruthy();
	fireEvent.press(getByTestId('message-reaction-:thumbsup:'));
	expect(queryByTestId('message-reaction-:thumbsup:')).toBeNull();
	expect(getByTestId('message-add-reaction')).toBeTruthy();
});
