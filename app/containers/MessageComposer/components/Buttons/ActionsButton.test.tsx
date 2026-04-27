import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { ActionsButton } from './ActionsButton';
import { setPermissions } from '../../../../actions/permissions';
import { selectServerRequest } from '../../../../actions/server';
import { setUser } from '../../../../actions/login';
import { mockedStore } from '../../../../reducers/mockedStore';
import { type IPermissionsState } from '../../../../reducers/permissions';
import { RoomContext, type IRoomContext } from '../../../../views/RoomView/context';
import { MessageInnerContext, type IMessageInnerContext } from '../../context';
import { initStore } from '../../../../lib/store/auxStore';

jest.mock('../../../ActionSheet', () => ({
	useActionSheet: () => ({
		showActionSheet: jest.fn(),
		hideActionSheet: jest.fn()
	})
}));

let mockCanUploadFile = false;
jest.mock('../../hooks/useCanUploadFile', () => ({
	useCanUploadFile: () => mockCanUploadFile
}));

jest.mock('../../hooks/useChooseMedia', () => ({
	useChooseMedia: () => ({
		takePhoto: jest.fn(),
		takeVideo: jest.fn(),
		chooseFromLibrary: jest.fn(),
		chooseFile: jest.fn()
	})
}));

const initialStoreState = () => {
	const baseUrl = 'https://open.rocket.chat';
	mockedStore.dispatch(selectServerRequest(baseUrl, '6.4.0'));
	mockedStore.dispatch(
		setUser({
			id: 'abc',
			username: 'rocket.cat',
			name: 'Rocket Cat',
			roles: ['user'],
			settings: {
				preferences: {
					convertAsciiEmoji: true
				}
			}
		})
	);
	initStore(mockedStore);
};

const roomContext: IRoomContext = {
	rid: 'rid',
	tmid: undefined,
	room: {
		rid: 'rid',
		t: 'c',
		tmid: undefined,
		name: 'general',
		fname: 'general',
		usernames: undefined,
		prid: undefined,
		federated: false
	},
	sharing: false,
	action: null,
	selectedMessages: [],
	editCancel: jest.fn(),
	editRequest: jest.fn(),
	onSendMessage: jest.fn(),
	onRemoveQuoteMessage: jest.fn()
};

const messageInnerContext: IMessageInnerContext = {
	closeEmojiKeyboardAndAction: jest.fn(),
	openEmojiKeyboard: jest.fn(),
	closeEmojiKeyboard: jest.fn(),
	mentions: [],
	channels: [],
	mentionsLoading: false,
	channelMentionsLoading: false,
	setMarkdownToolbar: jest.fn()
};

const Render = ({ context, permissions }: { context?: Partial<IRoomContext>; permissions?: IPermissionsState }) => {
	if (permissions) {
		mockedStore.dispatch(setPermissions(permissions));
	}
	return (
		<Provider store={mockedStore}>
			<RoomContext.Provider value={{ ...roomContext, ...context }}>
				<MessageInnerContext.Provider value={messageInnerContext}>
					<ActionsButton />
				</MessageInnerContext.Provider>
			</RoomContext.Provider>
		</Provider>
	);
};

describe('ActionsButton', () => {
	beforeEach(() => {
		mockedStore.dispatch(setPermissions({}));
		mockCanUploadFile = false;
	});

	describe('given user has start-discussion permission', () => {
		test('then Actions button is visible', () => {
			initialStoreState();
			render(
				<Render
					permissions={{
						'start-discussion': ['user']
					}}
				/>
			);
			expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
		});
	});

	describe('given user lacks start-discussion permission', () => {
		describe('and is not in livechat room', () => {
			test('then Actions button is not visible', () => {
				initialStoreState();
				render(
					<Render
						permissions={{
							'start-discussion': []
						}}
					/>
				);
				expect(screen.queryByTestId('message-composer-actions')).not.toBeOnTheScreen();
			});
		});
	});

	describe('given user has view-canned-responses permission', () => {
		test('and is in livechat room then Actions button is visible', () => {
			initialStoreState();
			render(
				<Render
					context={{
						t: 'l',
						room: {
							...roomContext.room,
							t: 'l'
						}
					}}
					permissions={{
						'view-canned-responses': ['user']
					}}
				/>
			);
			expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
		});
	});

	describe('permission combinations', () => {
		test('given only start-discussion permission, button is visible', () => {
			initialStoreState();
			render(
				<Render
					permissions={{
						'start-discussion': ['user'],
						'mobile-upload-file': [],
						'view-canned-responses': []
					}}
				/>
			);
			expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
		});

		test('given only upload permission, button is visible', () => {
			initialStoreState();
			mockCanUploadFile = true;
			render(<Render permissions={{}} />);
			expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
		});

		test('given no permissions, button is not visible', () => {
			initialStoreState();
			render(
				<Render
					permissions={{
						'start-discussion': [],
						'view-canned-responses': []
					}}
				/>
			);
			expect(screen.queryByTestId('message-composer-actions')).not.toBeOnTheScreen();
		});
	});
});
