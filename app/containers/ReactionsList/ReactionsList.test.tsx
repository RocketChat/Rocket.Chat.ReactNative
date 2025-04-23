import * as React from 'react';
import { screen, render } from '@testing-library/react-native';
import { Route } from 'reanimated-tab-view';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import ReactionsList from './index';
import { IReaction } from '../../definitions';

// Create a mock Redux store
const mockStore = createStore(
	(
		state = {
			settings: {
				UI_Use_Real_Name: true
			},
			login: {
				user: {
					username: 'testuser'
				}
			}
		}
	) => state
);

// Mock the TabView component since we don't need to test its internal functionality
jest.mock('../TabView', () => ({
	TabView: ({ routes, renderScene }: { routes: Route[]; renderScene: (props: { route: Route }) => React.ReactNode }) => {
		// Always render the first route (All tab) for testing
		const currentRoute = routes[0] || { key: 'all' };
		return renderScene({ route: currentRoute });
	}
}));

const mockGetCustomEmoji = () => null;

const mockReactions: IReaction[] = [
	{
		_id: 'reaction1',
		emoji: '👍',
		usernames: ['user1', 'user2'],
		names: ['User One', 'User Two']
	},
	{
		_id: 'reaction2',
		emoji: '❤️',
		usernames: ['user3'],
		names: ['User Three']
	}
];

const renderWithRedux = (component: React.ReactElement) => render(<Provider store={mockStore}>{component}</Provider>);

describe('ReactionsList', () => {
	it('renders empty ReactionsList when no reactions', () => {
		renderWithRedux(<ReactionsList getCustomEmoji={mockGetCustomEmoji} reactions={[]} />);
		expect(screen.getByTestId('reactionsList')).toBeOnTheScreen();
	});

	it('renders ReactionsList with reactions in All tab', () => {
		renderWithRedux(<ReactionsList getCustomEmoji={mockGetCustomEmoji} reactions={mockReactions} />);

		// Verify reactions are displayed in the All tab
		expect(screen.getByTestId('reactionsList')).toBeOnTheScreen();
		expect(screen.getByText('2 people reacted')).toBeOnTheScreen();
		expect(screen.getByText('1 person reacted')).toBeOnTheScreen();
		expect(screen.getByText('User One and User Two')).toBeOnTheScreen();
		expect(screen.getByText('User Three')).toBeOnTheScreen();
	});

	it('handles undefined reactions prop', () => {
		renderWithRedux(<ReactionsList getCustomEmoji={mockGetCustomEmoji} />);
		expect(screen.getByTestId('reactionsList')).toBeOnTheScreen();
	});
});
