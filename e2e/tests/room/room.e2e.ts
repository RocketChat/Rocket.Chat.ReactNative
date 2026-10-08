import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers, sendMessage as sendMessageAsUser } from '~e2e/support/api';
import {
	hideKeyboard,
	loginWithDeepLink,
	navigateToRoom,
	searchAndNavigateRoom,
	sendMessage,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible,
	backToRoomsList,
	expectHidden,
	expectVisible,
	goBackUntil,
	openMessageActions,
	tapUntilVisible,
	fillWhenUncovered,
	clearSettled
} from '~e2e/support/flows';
import { deleteMessage } from '~e2e/support/room';

afterEach(deleteCreatedUsers);

const MESSAGE = 'random-message';

const composer = ({ screen }: Fixtures) => screen.getByTestId('message-composer-input');

const expectAutocomplete = async (
	fixtures: Fixtures,
	typed: string,
	completed: string,
	{ selected, alsoListed = [] }: { selected: string; alsoListed?: readonly string[] }
) => {
	await composer(fixtures).pressSequentially(typed, { delay: 50 });
	for (const listedItemId of alsoListed) {
		await expectVisible(fixtures, `autocomplete-item-${listedItemId}`);
	}
	await tapWhenVisible(fixtures, `autocomplete-item-${selected}`);
	await expect(composer(fixtures)).toHaveValue(completed, { timeout: LONG_TIMEOUT });
	await expectHidden(fixtures, `autocomplete-item-${selected}`);
	await clearSettled(composer(fixtures));
};

const reactFromPicker = async (fixtures: Fixtures, emoji: string) => {
	await openMessageActions(fixtures, MESSAGE);
	await tapWhenVisible(fixtures, 'add-reaction');
	await tapWhenVisible(fixtures, 'emoji-picker-tab-emoji');
	await tapWhenVisible(fixtures, `emoji-${emoji}`);
	await expectVisible(fixtures, `message-reaction-:${emoji}:`);
};

const reactBySearch = async (fixtures: Fixtures, emoji: string) => {
	await openMessageActions(fixtures, MESSAGE);
	await tapWhenVisible(fixtures, 'add-reaction');
	await expectVisible(fixtures, 'emoji-searchbar-input');
	await fixtures.screen.getByTestId('emoji-searchbar-input').pressSequentially(emoji);
	if (fixtures.platform === 'android') {
		await hideKeyboard(fixtures);
	}
	await tapWhenVisible(fixtures, `emoji-${emoji}`);
	await expectVisible(fixtures, `message-reaction-:${emoji}:`);
};

const toggleReactionsList = async (fixtures: Fixtures, emoji: string) => {
	await expectVisible(fixtures, `message-reaction-:${emoji}:`);
	await fixtures.screen.getByTestId(`message-reaction-:${emoji}:`).longPress();
	await expectVisible(fixtures, 'reactionsList');
	await tapWhenVisible(fixtures, 'action-sheet-handle');
	await expectHidden(fixtures, 'reactionsList');
};

const expectProfileFromUsername = async (fixtures: Fixtures, username: string, roomName: string) => {
	const { screen } = fixtures;
	const header = screen.getByTestId(`username-header-${username}`).first();
	await expect(header).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapUntilVisible(fixtures, header, 'room-info-view-username');
	await expect(screen.getByText(`@${username}`, { exact: false }).first()).toBeVisible({ timeout: LONG_TIMEOUT });
	await goBackUntil(fixtures, 'room-view');
	await backToRoomsList(fixtures);
	await navigateToRoom(fixtures, roomName);
};

const startMessageAction = async (fixtures: Fixtures, message: string, action: string) => {
	await openMessageActions(fixtures, message);
	await tapWhenVisible(fixtures, `message-actions-${action}`);
};

const sendComposerText = async (fixtures: Fixtures, text: string) => {
	await composer(fixtures).pressSequentially(text);
	await tapWhenVisible(fixtures, 'message-composer-send');
};

const editMessage = async (fixtures: Fixtures) => {
	await sendMessage(fixtures, 'edit');
	await hideKeyboard(fixtures);
	await startMessageAction(fixtures, 'edit', 'edit');
	await fillWhenUncovered(composer(fixtures), 'edited');
	await tapWhenVisible(fixtures, 'message-composer-send');
	await expectVisible(fixtures, 'message-content-edited');
	await expectVisible(fixtures, 'edited-edited');
};

const quoteMessage = async (fixtures: Fixtures, authorName: string) => {
	await sendMessage(fixtures, 'quote');
	await startMessageAction(fixtures, 'quote', 'quote');
	await sendComposerText(fixtures, 'quoted');
	await expectVisible(fixtures, `reply-${authorName}-quote`);
};

const joinRoom = async (fixtures: Fixtures) => {
	await tapWhenVisible(fixtures, 'room-view-join-button');
	await expectHidden(fixtures, 'room-view-join-button');
	await expect(fixtures.screen.getByText(/joined the channel/)).toBeVisible({ timeout: LONG_TIMEOUT });
};

const openRoomWithOthersMessage = async (fixtures: Fixtures, message: string) => {
	const author = await createUser();
	const room = await createRandomRoom(author);
	await sendMessageAsUser(author, room._id, message);
	await expectVisible(fixtures, 'rooms-list-view');
	await searchAndNavigateRoom(fixtures, room.name);
	await expectVisible(fixtures, `message-content-${message}`);
	await joinRoom(fixtures);
	return { author, room };
};

const replyInDirectMessage = async (fixtures: Fixtures) => {
	const original = 'Message to reply in DM';
	const reply = 'replied in dm';
	const { author } = await openRoomWithOthersMessage(fixtures, original);
	await startMessageAction(fixtures, original, 'reply-in-dm');
	await expectVisible(fixtures, `room-view-title-${author.username}`);
	await fillWhenUncovered(composer(fixtures), reply);
	await hideKeyboard(fixtures);
	await tapWhenVisible(fixtures, 'message-composer-send');
	await expect(fixtures.screen.getByTestId(new RegExp(`^message-content-.*${reply}$`, 's'))).toBeVisible({
		timeout: LONG_TIMEOUT
	});
	await backToRoomsList(fixtures);
};

const leaveAndReopenRoom = async (fixtures: Fixtures, roomName: string) => {
	await backToRoomsList(fixtures);
	await navigateToRoom(fixtures, roomName);
};

const typeDraft = async (fixtures: Fixtures, text: string) => {
	await fillWhenUncovered(composer(fixtures), text);
	await hideKeyboard(fixtures);
};

const sendSavedDraft = async (fixtures: Fixtures, roomName: string) => {
	await searchAndNavigateRoom(fixtures, roomName);
	await typeDraft(fixtures, 'draft');
	await leaveAndReopenRoom(fixtures, roomName);
	await expect(composer(fixtures)).toHaveValue('draft', { timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'message-composer-send');
	await expectVisible(fixtures, 'message-content-draft');
	await backToRoomsList(fixtures);
};

const replaceDraftKeepingQuote = async (fixtures: Fixtures, roomName: string, original: string, text: string) => {
	await leaveAndReopenRoom(fixtures, roomName);
	await expectVisible(fixtures, `markdown-preview-${original}`);
	await clearSettled(composer(fixtures));
	await fillWhenUncovered(composer(fixtures), text);
	await expect(composer(fixtures)).toHaveValue(text, { timeout: LONG_TIMEOUT });
};

const saveQuoteDraft = async (fixtures: Fixtures) => {
	const original = '123';
	const quoteText = '123456';
	const { author, room } = await openRoomWithOthersMessage(fixtures, original);
	await typeDraft(fixtures, 'draft');
	await leaveAndReopenRoom(fixtures, room.name);
	await expect(composer(fixtures)).toHaveValue('draft', { timeout: LONG_TIMEOUT });
	await startMessageAction(fixtures, original, 'quote');
	await expectVisible(fixtures, `markdown-preview-${original}`);
	await replaceDraftKeepingQuote(fixtures, room.name, original, quoteText);
	await replaceDraftKeepingQuote(fixtures, room.name, original, quoteText);
	await leaveAndReopenRoom(fixtures, room.name);
	await expect(composer(fixtures)).toHaveValue(quoteText, { timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'message-composer-send');
	await expectVisible(fixtures, `reply-${author.name}-${original}`);
};

test('sends, reacts to and manages messages in a room', { tags: ['test-12'], timeout: 900_000 }, async fixtures => {
	const user = await createUser();
	const room = await createRandomRoom(user);

	await loginWithDeepLink(fixtures, user);
	await navigateToRoom(fixtures, room.name);
	await sendMessage(fixtures, MESSAGE);

	await expectAutocomplete(fixtures, ':joy', ':joy: ', { selected: 'joy', alsoListed: ['joystick'] });
	await expectAutocomplete(fixtures, `@${user.username}`, `@${user.username} `, { selected: user.username });
	await expectAutocomplete(fixtures, '#translation-test', '#translation-test ', { selected: 'translation-test' });

	await reactFromPicker(fixtures, 'grinning');
	await reactBySearch(fixtures, 'laughing');
	await tapWhenVisible(fixtures, 'message-reaction-:grinning:');
	await expectHidden(fixtures, 'message-reaction-:grinning:');

	await startMessageAction(fixtures, MESSAGE, 'emoji-grinning');
	await expectVisible(fixtures, 'message-reaction-:grinning:');

	await tapWhenVisible(fixtures, 'message-add-reaction');
	await expectVisible(fixtures, 'reaction-picker');
	await expectVisible(fixtures, 'emoji-grinning');
	await tapWhenVisible(fixtures, 'emoji-picker-tab-emoji');
	await tapWhenVisible(fixtures, 'emoji-wink');
	await expectVisible(fixtures, 'message-reaction-:wink:');

	await toggleReactionsList(fixtures, 'laughing');

	const otherUser = await createUser();
	await sendMessageAsUser(otherUser, room._id, 'new message');
	await expectProfileFromUsername(fixtures, user.username, room.name);
	await expectProfileFromUsername(fixtures, otherUser.username, room.name);

	await editMessage(fixtures);
	await quoteMessage(fixtures, user.name);

	await backToRoomsList(fixtures);
	await tapWhenVisible(fixtures, 'markdown-preview-You: quoted');
	await expectVisible(fixtures, `room-view-title-${room.name}`);

	await sendMessage(fixtures, 'message to delete');
	await deleteMessage(fixtures, 'message to delete');
	await backToRoomsList(fixtures);

	await replyInDirectMessage(fixtures);
	await sendSavedDraft(fixtures, room.name);
	await saveQuoteDraft(fixtures);
});
