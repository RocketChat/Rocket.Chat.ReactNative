import React from 'react';
import { fireEvent, render, within } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import ReactionsList from '.';
import { mockedStore } from '../../reducers/mockedStore';

const getCustomEmoji = jest.fn();
const reactions = [
	{
		emoji: 'marioparty',
		_id: 'marioparty',
		usernames: ['rocket.cat', 'diego.mello'],
		names: ['Rocket Cat', 'Diego Mello']
	},
	{
		emoji: 'react_rocket',
		_id: 'react_rocket',
		usernames: ['rocket.cat', 'diego.mello'],
		names: ['Rocket Cat', 'Diego Mello']
	},
	{
		emoji: 'nyan_rocket',
		_id: 'nyan_rocket',
		usernames: ['rocket.cat'],
		names: ['Rocket Cat']
	},
	{
		emoji: 'grinning',
		_id: 'grinning',
		usernames: ['diego.mello'],
		names: ['Diego Mello']
	}
];

const Render = () => (
	<Provider store={mockedStore}>
		<ReactionsList getCustomEmoji={getCustomEmoji} reactions={reactions} />
	</Provider>
);

describe('ReactionsList', () => {
	test('should render Reactions List', async () => {
		const { findByTestId } = render(<Render />);
		const ReactionsListView = await findByTestId('reactionsList');
		expect(ReactionsListView).toBeTruthy();
	});

	test('should render tab bar', async () => {
		const { findByTestId } = render(<Render />);
		const AllTab = await findByTestId('reactionsTabBar');
		expect(AllTab).toBeTruthy();
	});

	test('should render All tab', async () => {
		const { findByTestId } = render(<Render />);
		const AllTab = await findByTestId('reactionsListAllTab');
		expect(AllTab).toBeTruthy();
	});

	test('correct tab on clicking tab item', async () => {
		const { findByTestId } = render(<Render />);
		const tab = await findByTestId(`tabBarItem-${reactions[0].emoji}`);
		fireEvent.press(tab);
		const usersList = await findByTestId(`usersList-${reactions[0].emoji}`);
		expect(usersList).toBeTruthy();
		const emojiName = await within(usersList).getByTestId(`usersListEmojiName`);
		expect(emojiName.props.children).toEqual(reactions[0].emoji);
	});

	test('should render correct number of reactions', async () => {
		const { findByTestId } = render(<Render />);
		const tab = await findByTestId(`tabBarItem-${reactions[0].emoji}`);
		fireEvent.press(tab);
		const usersList = await findByTestId(`usersList-${reactions[0].emoji}`);
		const allReactions = await within(usersList).getAllByTestId('userItem');
		expect(allReactions).toHaveLength(reactions[0].usernames.length);
	});
});
