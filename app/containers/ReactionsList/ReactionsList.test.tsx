import * as React from 'react';
import { screen, render, fireEvent, within } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import ReactionsList from './index';
import { IReaction } from '../../definitions';

// Mock i18n
jest.mock('../../i18n', () => ({
	t: (key: string, options?: { count?: number; n?: number }) => {
		switch (key) {
			case 'All':
				return 'All';
			case '1_person_reacted':
				return '1 person reacted';
			case 'N_people_reacted':
				return `${options?.n} people reacted`;
			case 'and':
				return 'and';
			case 'and_N_more':
				return `and ${options?.count} more`;
			case 'you':
				return 'you';
			default:
				return key;
		}
	}
}));

// Mock Avatar component
jest.mock('../Avatar', () => {
	const React = require('react');
	const { View, Text } = require('react-native');
	return {
		__esModule: true,
		default: ({ text, size }: { text: string; size: number }) => (
			<View style={{ width: size, height: size }} testID='avatar'>
				<Text>{text}</Text>
			</View>
		)
	};
});

interface IRoute {
	key: string;
	title?: string;
	emoji?: string;
	usernames?: string[];
	names?: string[];
}

interface ITabViewProps {
	routes: IRoute[];
	renderScene: (props: { route: IRoute }) => React.ReactNode;
	renderTabItem: (route: IRoute, color: string) => React.ReactNode;
}

// Mock TabView to better match the actual implementation
jest.mock('../TabView', () => {
	const React = require('react');
	const { View, TouchableOpacity } = require('react-native');

	return {
		TabView: ({ routes, renderScene, renderTabItem }: ITabViewProps) => {
			const [index, setIndex] = React.useState(0);

			const jumpTo = (key: string) => {
				const newIndex = routes.findIndex((route: IRoute) => route.key === key);
				setIndex(newIndex);
			};

			return (
				<View testID='tabView'>
					<View style={{ flexDirection: 'row' }}>
						{routes.map((route, idx) => (
							<TouchableOpacity key={route.key} testID={`tab-${route.key}`} onPress={() => jumpTo(route.key)}>
								{renderTabItem(route, idx === index ? '#FF0000' : '#666666')}
							</TouchableOpacity>
						))}
					</View>
					{renderScene({ route: routes[index] })}
				</View>
			);
		}
	};
});

// Create a more complete mock Redux store
const mockStore = createStore(
	(
		state = {
			settings: {
				UI_Use_Real_Name: true
			},
			login: {
				user: {
					id: 'user123',
					username: 'testuser',
					name: 'Test User'
				}
			},
			server: {
				server: 'https://open.rocket.chat',
				version: '6.0.0'
			}
		}
	) => state
);

const mockGetCustomEmoji = (emoji: string) => ({
	name: emoji,
	extension: 'png'
});

const mockReactions: IReaction[] = [
	{
		_id: 'reaction1',
		emoji: '👍',
		usernames: ['user1', 'user2', 'testuser', 'user4'],
		names: ['User One', 'User Two', 'Test User', 'User Four']
	},
	{
		_id: 'reaction2',
		emoji: '❤️',
		usernames: ['user3'],
		names: ['User Three']
	}
];

const renderWithRedux = (component: React.ReactElement) => render(<Provider store={mockStore}>{component}</Provider>);

describe('ReactionsList Integration Tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders empty ReactionsList when no reactions', () => {
		renderWithRedux(<ReactionsList getCustomEmoji={mockGetCustomEmoji} reactions={[]} />);
		expect(screen.getByTestId('reactionsList')).toBeOnTheScreen();
		expect(screen.getByTestId('reactionsListAllTab')).toBeOnTheScreen();
	});

	it('renders ReactionsList with reactions and allows navigation between tabs', () => {
		renderWithRedux(<ReactionsList getCustomEmoji={mockGetCustomEmoji} reactions={mockReactions} />);

		// Verify All tab content
		expect(screen.getByText('4 people reacted')).toBeOnTheScreen();
		expect(screen.getByText('User One, User Two, you and 1 more')).toBeOnTheScreen();
		expect(screen.getByText('1 person reacted')).toBeOnTheScreen();
		expect(screen.getByText('User Three')).toBeOnTheScreen();

		// Switch to thumbs up tab and verify content
		fireEvent.press(screen.getByTestId('tab-👍'));
		expect(screen.getByTestId('usersList-👍')).toBeOnTheScreen();
		expect(screen.getByTestId('usersListEmojiName')).toBeOnTheScreen();
		expect(screen.getByText('User One')).toBeOnTheScreen();
		expect(screen.getByText('User Two')).toBeOnTheScreen();
		expect(screen.getByText('Test User')).toBeOnTheScreen();
		expect(screen.getByText('User Four')).toBeOnTheScreen();

		// Switch to heart tab and verify content
		fireEvent.press(screen.getByTestId('tab-❤️'));
		expect(screen.getByTestId('usersList-❤️')).toBeOnTheScreen();
		expect(screen.getByTestId('usersListEmojiName')).toBeOnTheScreen();
		expect(screen.getByText('User Three')).toBeOnTheScreen();
	});

	it('handles real name toggle correctly', () => {
		const storeWithoutRealNames = createStore(
			(
				state = {
					settings: {
						UI_Use_Real_Name: false
					},
					login: {
						user: {
							id: 'user123',
							username: 'testuser',
							name: 'Test User'
						}
					},
					server: {
						server: 'https://open.rocket.chat',
						version: '6.0.0'
					}
				}
			) => state
		);

		render(
			<Provider store={storeWithoutRealNames}>
				<ReactionsList getCustomEmoji={mockGetCustomEmoji} reactions={mockReactions} />
			</Provider>
		);

		// Verify usernames are shown instead of real names in the All tab
		expect(screen.getByText('user1, user2, you and 1 more')).toBeOnTheScreen();
		expect(screen.getByText('user3')).toBeOnTheScreen();

		// Switch to thumbs up tab and verify username display
		fireEvent.press(screen.getByTestId('tab-👍'));

		// Get all user items
		const userItems = screen.getAllByTestId('userItem');
		expect(userItems).toHaveLength(4);

		// Get all username texts within the user items
		const usernameTexts = userItems.map(item => {
			const textElements = within(item).getAllByText(/^(user1|user2|testuser|user4)$/);
			return textElements[0].props.children;
		});

		// Verify all expected usernames are present
		expect(usernameTexts).toEqual(expect.arrayContaining(['user1', 'user2', 'testuser', 'user4']));
	});

	it('handles custom emojis correctly', () => {
		const customReactions: IReaction[] = [
			{
				_id: 'reaction3',
				emoji: ':custom_emoji:',
				usernames: ['user1'],
				names: ['User One']
			}
		];

		renderWithRedux(<ReactionsList getCustomEmoji={mockGetCustomEmoji} reactions={customReactions} />);

		// Verify custom emoji is rendered
		expect(screen.getByTestId('tab-:custom_emoji:')).toBeOnTheScreen();
		expect(screen.getByText('1 person reacted')).toBeOnTheScreen();
	});
});
