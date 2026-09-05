import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { ActionsButton } from './ActionsButton';
import { setPermissions } from '../../../../actions/permissions';
import { selectServerRequest } from '../../../../actions/server';
import { setUser } from '../../../../actions/login';
import { mockedStore } from '../../../../reducers/mockedStore';
import { RoomContext, type IRoomContext } from '../../../../views/RoomView/context';
import { MessageInnerContext, type TMessageInnerContext } from '../../context';
import { initStore } from '../../../../lib/store/auxStore';

const mockActionSheet = {
	showActionSheet: jest.fn(),
	hideActionSheet: jest.fn()
};
jest.mock('../../../ActionSheet', () => ({
	useActionSheet: () => mockActionSheet
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

const messageInnerContext: TMessageInnerContext = {
	sendMessage: jest.fn(),
	onEmojiSelected: jest.fn(),
	closeEmojiKeyboardAndAction: (action?: Function, params?: any) => action?.(params),
	focus: jest.fn()
};

const renderActionsButton = ({ context }: { context?: Partial<IRoomContext> }) =>
	render(
		<Provider store={mockedStore}>
			<RoomContext.Provider value={{ ...roomContext, ...context }}>
				<MessageInnerContext.Provider value={messageInnerContext}>
					<ActionsButton />
				</MessageInnerContext.Provider>
			</RoomContext.Provider>
		</Provider>
	);

describe('ActionsButton', () => {
	beforeEach(() => {
		mockedStore.dispatch(setPermissions({}));
		mockCanUploadFile = false;
		mockActionSheet.showActionSheet.mockReset();
	});

	describe('given user has start-discussion permission', () => {
		test('then Actions button is visible and Create discussion option is present', () => {
			initialStoreState();
			mockedStore.dispatch(setPermissions({ 'start-discussion': ['user'] }));
			renderActionsButton({});
			expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
			fireEvent.press(screen.getByTestId('message-composer-actions'));
			expect(mockActionSheet.showActionSheet).toHaveBeenCalled();
			const { options } = mockActionSheet.showActionSheet.mock.calls.at(-1)[0];
			expect(options.some((o: { title: string }) => o.title === 'Create discussion')).toBe(true);
		});
	});

	describe('given user lacks start-discussion permission', () => {
		describe('and has no other permissions', () => {
			test('then Actions button is not visible', () => {
				initialStoreState();
				mockedStore.dispatch(setPermissions({ 'start-discussion': [] }));
				renderActionsButton({});
				expect(screen.queryByTestId('message-composer-actions')).not.toBeOnTheScreen();
			});
		});
		describe('but has upload permission', () => {
			test('then Actions button is visible but Create discussion option is absent', () => {
				initialStoreState();
				mockCanUploadFile = true;
				mockedStore.dispatch(setPermissions({ 'start-discussion': [] }));
				renderActionsButton({});
				expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
				fireEvent.press(screen.getByTestId('message-composer-actions'));
				const { options } = mockActionSheet.showActionSheet.mock.calls.at(-1)[0];
				expect(options.some((o: { title: string }) => o.title === 'Create discussion')).toBe(false);
			});
		});
	});

	describe('given user has view-canned-responses permission', () => {
		test('and is in livechat room then Actions button is visible', () => {
			initialStoreState();
			mockedStore.dispatch(setPermissions({ 'view-canned-responses': ['user'] }));
			renderActionsButton({
				context: {
					t: 'l',
					room: {
						...roomContext.room,
						t: 'l'
					}
				}
			});
			expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
		});
	});

	describe('permission combinations', () => {
		test('given only start-discussion permission, button is visible and option is present', () => {
			initialStoreState();
			mockedStore.dispatch(
				setPermissions({
					'start-discussion': ['user'],
					'mobile-upload-file': [],
					'view-canned-responses': []
				})
			);
			renderActionsButton({});
			expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
			fireEvent.press(screen.getByTestId('message-composer-actions'));
			const { options } = mockActionSheet.showActionSheet.mock.calls.at(-1)[0];
			expect(options.some((o: { title: string }) => o.title === 'Create discussion')).toBe(true);
		});

		test('given only upload permission, button is visible but Create discussion is absent', () => {
			initialStoreState();
			mockCanUploadFile = true;
			mockedStore.dispatch(setPermissions({}));
			renderActionsButton({});
			expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
			fireEvent.press(screen.getByTestId('message-composer-actions'));
			const { options } = mockActionSheet.showActionSheet.mock.calls.at(-1)[0];
			expect(options.some((o: { title: string }) => o.title === 'Create discussion')).toBe(false);
		});

		test('given no permissions, button is not visible', () => {
			initialStoreState();
			mockedStore.dispatch(
				setPermissions({
					'start-discussion': [],
					'view-canned-responses': []
				})
			);
			renderActionsButton({});
			expect(screen.queryByTestId('message-composer-actions')).not.toBeOnTheScreen();
		});
	});
});
