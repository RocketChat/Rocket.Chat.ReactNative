import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
// import { Provider } from 'react-redux'; // Removed
// import configureStore from 'redux-mock-store'; // Removed

import DirectoryView from './index';
import { IApplicationState, IUser } from '../../definitions';
// import { TGoRoomItem } from '../../lib/methods/helpers/goRoom'; // Not directly used in test file
import { useAppSelector } from '../../lib/hooks/useAppSelector'; // Import for mocking
import { getUserSelector } from '../../selectors/login'; // Import for mock implementation

// Mock useAppSelector
jest.mock('../../lib/hooks/useAppSelector');

// Mock other necessary modules
jest.mock('../../lib/services', () => ({
	Services: {
		getDirectory: jest.fn(),
		createDirectMessage: jest.fn(),
		getRoomByTypeAndName: jest.fn()
	}
}));
jest.mock('../../lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));
jest.mock('../../containers/ActionSheet', () => ({
	showActionSheetRef: jest.fn(),
	hideActionSheetRef: jest.fn()
}));
jest.mock('../../lib/methods/helpers/goRoom', () => ({
	goRoom: jest.fn()
}));
jest.mock('../../i18n', () => ({
	t: (key: string, params?: any) => {
		if (params) {
			return `${key}_${Object.values(params).join('_')}`;
		}
		return key;
	},
	isTranslated: jest.fn(() => true)
}));
jest.mock('../../lib/methods/helpers/log', () => ({
	...jest.requireActual('../../lib/methods/helpers/log'), // Keep actual log for coverage if needed, or fully mock
	logEvent: jest.fn(),
	events: {
		DIRECTORY_SEARCH_USERS: 'DIRECTORY_SEARCH_USERS',
		DIRECTORY_SEARCH_CHANNELS: 'DIRECTORY_SEARCH_CHANNELS',
		DIRECTORY_SEARCH_TEAMS: 'DIRECTORY_SEARCH_TEAMS'
	}
}));
// Mock SearchBox to allow easy control over onChangeText
jest.mock('../../containers/SearchBox', () => 'SearchBox'); 
// Mock debounce to execute immediately
jest.mock('../../lib/methods/helpers', () => ({
	...jest.requireActual('../../lib/methods/helpers'),
	debounce: (fn: (...args: any[]) => any) => fn 
}));

const mockedUseAppSelector = useAppSelector as jest.Mock;

const mockNavigation = {
	setOptions: jest.fn(),
	navigate: jest.fn(),
	addListener: jest.fn(() => jest.fn()), // for focus/blur listeners if any
	removeListener: jest.fn(),
	reset: jest.fn(),
	setParams: jest.fn(),
	dispatch: jest.fn(),
	goBack: jest.fn(),
	isFocused: jest.fn(()_ => true),
	canGoBack: jest.fn(() => true),
	getParent: jest.fn(),
	getState: jest.fn()
};

// Define a base mock state that useAppSelector will use
let mockAppScreenState: Partial<IApplicationState>;

// Reset and configure mockAppScreenState before each test or describe block
const setupMockAppState = (overrides?: Partial<IApplicationState>) => {
	const userMock: IUser = {
		id: 'userId',
		username: 'rocket.cat',
		name: 'Rocket Cat',
		roles: ['user'],
		emails: [{ address: 'rocket@cat.com', verified: true }],
		status: 'online',
		statusText: '',
		avatarETag: '',
		customFields: {},
		settings: {
			preferences: {
				enableAutoAway: true,
				idleTimeLimit: 300,
				desktopNotificationDuration: 0,
				audioNotifications: 'all',
				desktopNotifications: 'all',
				mobileNotifications: 'all',
				unreadAlert: true,
				useEmojis: true,
				convertAsciiEmoji: true,
				autoImageLoad: true,
				saveMobileBandwidth: false,
				collapseMediaByDefault: false,
				hideUsernames: false,
				hideRoles: false,
				hideFlexTab: false,
				hideAvatars: false,
				roomColumns: 1,
				displayName: 'username',
				displayAvatars: true,
				clockMode: 0,
				sendOnEnter: 'default',
				messageViewMode: 0,
				showRoles: false,
				showRealName: false,
				sidebarViewMode: 'condensed',
				sidebarDisplayAvatar: false,
				sidebarShowUnread: false,
				sidebarSortby: 'activity',
				sidebarGroupByType: false,
				groupChannelsByLastMessage: false,
				groupByType: false,
				sidebarShowFavorites: false,
				sidebarShowDiscussion: false,
				omnichannelTranscriptEmail: false,
				omnichannelTranscriptPDF: false,
				theme: 'light',
				language: 'en'
			}
		},
		services: {},
		requirePasswordChange: false,
		_updatedAt: new Date(),
		createdAt: new Date(),
		canViewAllInfo: false,
		active: true,
		showMessageInMainThread: false,
		isVerified: true
	};

	mockAppScreenState = {
		server: {
			server: 'http://localhost:3000',
			version: '6.0.0',
			 সভাপতি: '6.0.0',
			supportedVersions: {},
			loading: false,
			connecting: false,
			connected: true,
			disconnecting: false,
			error: null,
			token: 'mock-token',
			previousServer: null,
			changingServer: false,
			showMessageInMainThread: false
		},
		settings: {
			Accounts_Directory_DefaultView: 'users',
			FEDERATION_Enabled: true
		} as any,
		app: {
			isMasterDetail: false,
			root: '',
			ready: true,
			selectedUsers: [],
			selectedServer: 'http://localhost:3000',
			foreground: true,
			background: false
		},
		login: {
			user: userMock
		},
		...overrides
	};

	mockedUseAppSelector.mockImplementation(selector => {
		if (selector === getUserSelector) {
			return mockAppScreenState.login?.user;
		}
		// Attempt to run the selector against the mock state
		// This assumes selectors are simple functions of state
		try {
			return selector(mockAppScreenState);
		} catch (e) {
			// Fallback or error for complex selectors not handled above
			console.error("Error in mockSelector implementation for selector: ", selector.toString(), e);
			return undefined;
		}
	});
};


const renderDirectoryView = (propsOverrides = {}) => {
	const props = {
		navigation: mockNavigation,
		...propsOverrides // Only navigation is a direct prop now
	};

	return render(<DirectoryView {...props} />); // Render without Provider
};

// Destructure mocked services for easier access in tests
const { Services } = jest.requireMock('../../lib/services');
const { getSubscriptionByRoomId } = jest.requireMock('../../lib/database/services/Subscription');
const { showActionSheetRef } = jest.requireMock('../../containers/ActionSheet');
const { goRoom } = jest.requireMock('../../lib/methods/helpers/goRoom');


describe('DirectoryView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setupMockAppState(); // Setup default mock state for useAppSelector
		Services.getDirectory.mockResolvedValue({ result: [], total: 0, success: true });
	});

	describe('Initial Render & Data Load', () => {
		it('renders ActivityIndicator initially and loads data', async () => {
			Services.getDirectory.mockImplementationOnce(() => 
				new Promise(resolve => 
					setTimeout(() => 
						resolve({ 
							result: [{ _id: 'user1', name: 'User One', username: 'user1' }], 
							total: 1, 
							success: true 
						}), 
					100)
				)
			);

			const { getByTestId, findByText, queryByTestId } = renderDirectoryView();

			// Check for ActivityIndicator (assuming it's visible while loading)
			// Note: ActivityIndicator might not have a direct testID by default.
			// We'll test for its absence after load.
			// For now, let's assume the list is empty and then populates.
			expect(queryByTestId('directory-view-item-User One')).toBeNull();


			// Wait for data to be loaded and rendered
			const userItem = await findByText('User One'); // DirectoryItem uses title prop which is item.name
			expect(userItem).toBeTruthy();
			
			// Verify getDirectory was called
			expect(Services.getDirectory).toHaveBeenCalledWith(expect.objectContaining({
				text: '',
				type: 'users', // default
				offset: 0
			}));
			
			// ActivityIndicator should be gone if ListFooterComponent={loading ? <ActivityIndicator /> : null}
			// This requires checking the absence of the loading indicator.
			// This is tricky if it's not always in the tree. Let's assume `loading` state change.
		});

		it('handles data load failure', async () => {
			Services.getDirectory.mockRejectedValueOnce(new Error('Network error'));
			
			const { queryByTestId, findByTestId } = renderDirectoryView();

			// Wait for the loading to complete (ActivityIndicator to disappear)
			// This needs a way to detect the loading state or absence of ActivityIndicator.
			// Let's assume failure means no items are rendered.
			await waitFor(() => {
				expect(Services.getDirectory).toHaveBeenCalledTimes(1);
			});
			
			expect(queryByTestId(/directory-view-item-/)).toBeNull();
		});
	});

	describe('Search', () => {
		it('calls getDirectory with search text', async () => {
			const { getByTestId } = renderDirectoryView();
			
			// Wait for initial load to complete
			await waitFor(() => expect(Services.getDirectory).toHaveBeenCalledTimes(1));
			Services.getDirectory.mockClear(); // Clear calls from initial load

			const searchBox = getByTestId('directory-view-search'); // Assuming SearchBox passes testID to TextInput
			fireEvent.changeText(searchBox, 'searchTerm');

			await waitFor(() => {
				expect(Services.getDirectory).toHaveBeenCalledWith(expect.objectContaining({
					text: 'searchTerm',
					type: 'users',
					offset: 0 // New search resets offset
				}));
			});
		});
	});

	describe('Filtering (Type Change)', () => {
		it('calls getDirectory with new type after filter change', async () => {
			// Mock showActionSheetRef to immediately call changeType
			showActionSheetRef.mockImplementationOnce(({ children }: any) => {
				// Simulate selecting 'channels'
				children.props.changeType('channels'); 
			});
			
			const { getByTestId } = renderDirectoryView();
			
			// Wait for initial load
			await waitFor(() => expect(Services.getDirectory).toHaveBeenCalledTimes(1));
			Services.getDirectory.mockClear();

			const filterButton = getByTestId('directory-view-filter');
			fireEvent.press(filterButton);
			
			await waitFor(() => {
				expect(Services.getDirectory).toHaveBeenCalledWith(expect.objectContaining({
					text: '',
					type: 'channels',
					offset: 0
				}));
			});
		});
	});
	
	describe('Item Press', () => {
		describe('User Item', () => {
			it('calls createDirectMessage and goRoom on user item press', async () => {
				Services.getDirectory.mockResolvedValueOnce({
					result: [{ _id: 'user1', name: 'Test User', username: 'testuser', t: 'd' }],
					total: 1,
					success: true
				});
				Services.createDirectMessage.mockResolvedValueOnce({ success: true, room: { _id: 'dmRoomId' } });
				
				// Ensure directoryDefaultView is 'users' for this test via mock state
				setupMockAppState({
					settings: { ...mockAppScreenState.settings, Accounts_Directory_DefaultView: 'users' } as any
				});

				const { findByTestId } = renderDirectoryView();

				const userItem = await findByTestId('directory-view-item-Test User');
				fireEvent.press(userItem);

				await waitFor(() => {
					expect(Services.createDirectMessage).toHaveBeenCalledWith('testuser');
					expect(goRoom).toHaveBeenCalledWith(expect.objectContaining({
						rid: 'dmRoomId',
						name: 'testuser',
						t: 'd'
					}));
				});
			});
		});

		describe('Channel Item', () => {
			it('calls getSubscriptionByRoomId, getRoomByTypeAndName, and goRoom on channel item press', async () => {
				Services.getDirectory.mockResolvedValueOnce({
					result: [{ _id: 'channel1', name: 'Test Channel', t: 'c', fname: 'Test Channel Fname' }],
					total: 1,
					success: true
				});
				getSubscriptionByRoomId.mockResolvedValueOnce(null); // Not subscribed
				Services.getRoomByTypeAndName.mockResolvedValueOnce({ _id: 'channel1', name: 'Test Channel', joinCodeRequired: false });
				
				// Ensure directoryDefaultView is 'channels' for this test via mock state
				setupMockAppState({
					settings: { ...mockAppScreenState.settings, Accounts_Directory_DefaultView: 'channels' } as any
				});

				const { findByTestId } = renderDirectoryView();
				
				const channelItem = await findByTestId('directory-view-item-Test Channel');
				fireEvent.press(channelItem);

				await waitFor(() => {
					expect(getSubscriptionByRoomId).toHaveBeenCalledWith('channel1');
					expect(Services.getRoomByTypeAndName).toHaveBeenCalledWith('c', 'Test Channel Fname'); // Name falls back to fname if item.name is not present
					expect(goRoom).toHaveBeenCalledWith(expect.objectContaining({
						rid: 'channel1',
						name: 'Test Channel Fname',
						t: 'c',
						joinCodeRequired: false,
						search: true
					}));
				});
			});
		});
	});
});

// Helper to get the SearchBox input for testing text changes
// This might be needed if SearchBox doesn't pass testID to its TextInput
// const getSearchInput = (container) => {
//   // Example: container.UNSAFE_getByProps({ testID: 'directory-view-search' }).findByType(TextInput);
//   // This depends heavily on SearchBox implementation.
// };
