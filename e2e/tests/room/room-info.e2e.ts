import { afterEach, test } from '~e2e/support/fixtures';
import { expect, type Locator } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers, get } from '~e2e/support/api';
import {
	clearSettled,
	fillSettled,
	fillWhenUncovered,
	hideKeyboard,
	loginWithDeepLink,
	type Fixtures,
	LONG_TIMEOUT,
	confirmAlert,
	expectVisible,
	goBackUntil,
	succeeds,
	headerItem
} from '~e2e/support/flows';
import { tapHeaderItem } from '~e2e/support/header';
import { openRoomScreen } from '~e2e/support/appduct';
import { navigateToRoomInfo } from '~e2e/support/room';

afterEach(deleteCreatedUsers);

const EDIT_FIELDS = ['name', 'description', 'topic', 'announcement'] as const;
const EDIT_CONTROLS = ['password', 't', 'ro', 'submit', 'reset', 'archive', 'delete'] as const;
const CLEARABLE_FIELDS = ['topic', 'announcement', 'description', 'password'] as const;
const READABLE_CLEARABLE_FIELDS = CLEARABLE_FIELDS.filter(field => field !== 'password');

const editViewTestId = (field: string) => `room-info-edit-view-${field}`;

const scrollToEditControl = async ({ screen }: Fixtures, field: string, direction: 'up' | 'down' = 'down') => {
	await screen.scrollUntilVisible(screen.getByTestId(editViewTestId(field)), { direction, timeout: LONG_TIMEOUT });
};

const KEYBOARD_SAFE_TOP = 250;

const raiseAboveKeyboard = async ({ screen }: Fixtures, input: Locator) => {
	const box = await input.boundingBox();
	if (!box || box.y <= KEYBOARD_SAFE_TOP) return;
	await screen.swipe({ from: { x: 4, y: box.y }, to: { x: 4, y: KEYBOARD_SAFE_TOP }, duration: 800 });
};

const fillEditField = async (fixtures: Fixtures, field: string, value: string) => {
	await scrollToEditControl(fixtures, field);
	const input = fixtures.screen.getByTestId(editViewTestId(field));
	if (field === 'password') {
		await fillWhenUncovered(input, value);
	} else if (fixtures.platform === 'android') {
		await fillSettled(input, value);
	} else {
		await raiseAboveKeyboard(fixtures, input);
		await clearSettled(input);
		await input.pressSequentially(value);
	}
	await hideKeyboard(fixtures);
};

const fillEditFields = async (fixtures: Fixtures, fieldValues: readonly (readonly [string, string])[]) => {
	for (const [field, value] of fieldValues) {
		await fillEditField(fixtures, field, value);
	}
};

const tapEditControl = async (fixtures: Fixtures, field: string) => {
	await scrollToEditControl(fixtures, field);
	await fixtures.screen.getByTestId(editViewTestId(field)).tap();
};

const makeRoomPublic = async (fixtures: Fixtures) => {
	const roomTypeSwitch = fixtures.screen.getByTestId(editViewTestId('t'));
	await tapEditControl(fixtures, 't');
	if (!(await succeeds(expect(roomTypeSwitch).toBeChecked({ timeout: 5_000 })))) {
		await roomTypeSwitch.tap();
	}
	await expect(roomTypeSwitch).toBeChecked({ timeout: LONG_TIMEOUT });
};

const openEditView = async (fixtures: Fixtures) => {
	await tapHeaderItem(fixtures, 'room-info-view-edit-button', 'Room info edit');
	await expectVisible(fixtures, 'room-info-edit-view');
};

const reopenEditView = async (fixtures: Fixtures) => {
	await goBackUntil(fixtures, 'room-info-view');
	await openEditView(fixtures);
};

const submitEdit = async (fixtures: Fixtures) => {
	await tapEditControl(fixtures, 'submit');
	const successToast = fixtures.screen.getByText(/Settings succesfully changed/);
	if (fixtures.platform === 'android') {
		await expect(successToast).toBeVisible({ timeout: LONG_TIMEOUT });
	}
	await expect(successToast).toBeHidden({ timeout: LONG_TIMEOUT });
};

const submitAndReturnToInfo = async (fixtures: Fixtures) => {
	await submitEdit(fixtures);
	await goBackUntil(fixtures, 'room-info-view');
};

const expectInfoText = ({ screen }: Fixtures, text: string) =>
	expect(screen.getByText(text, { exact: false }).first()).toBeVisible({ timeout: LONG_TIMEOUT });

const expectInfoView = async (fixtures: Fixtures) => {
	await expectVisible(fixtures, 'room-info-view');
	await expectVisible(fixtures, 'room-info-view-name');
	for (const label of ['Description', 'Topic', 'Announcement']) {
		await expect(fixtures.screen.getByText(label)).toBeVisible({ timeout: LONG_TIMEOUT });
	}
	await expect(headerItem(fixtures, 'room-info-view-edit-button', 'Room info edit')).toBeVisible({ timeout: LONG_TIMEOUT });
};

const expectEditView = async (fixtures: Fixtures) => {
	for (const field of EDIT_FIELDS) {
		await expectVisible(fixtures, editViewTestId(field));
	}
	for (const control of EDIT_CONTROLS) {
		await scrollToEditControl(fixtures, control);
	}
};

const fillAndResetForm = async (fixtures: Fixtures) => {
	await fillEditFields(
		fixtures,
		['name', ...CLEARABLE_FIELDS].map(field => [field, 'abc'] as const)
	);
	for (const control of ['t', 'ro', 'react-when-ro', 'reset']) {
		await tapEditControl(fixtures, control);
	}
};

const expectFormReset = async (fixtures: Fixtures, roomName: string) => {
	const { screen } = fixtures;
	await screen.scrollUntilVisible(screen.getByTestId('avatar-edit-button'), { direction: 'up', timeout: LONG_TIMEOUT });
	if (fixtures.platform === 'android') {
		await scrollToEditControl(fixtures, 'name');
		await expect(screen.getByTestId(editViewTestId('name'))).toHaveValue(roomName);
	}
	for (const field of READABLE_CLEARABLE_FIELDS) {
		await scrollToEditControl(fixtures, field);
		await expect(screen.getByTestId(editViewTestId(field))).toHaveValue('');
	}
	await scrollToEditControl(fixtures, 'password');
	for (const toggle of ['t', 'ro']) {
		await scrollToEditControl(fixtures, toggle);
		await expect(screen.getByTestId(editViewTestId(toggle))).not.toBeChecked();
	}
	await screen.scrollUntilVisible(screen.getByTestId('room-info-edit-switch-system-messages'), { timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId(editViewTestId('react-when-ro'))).toBeHidden();
};

test('shows and edits room info', { tags: ['test-8'], timeout: 600_000 }, async fixtures => {
	const user = await createUser();
	const room = await createRandomRoom(user, 'p');
	const newRoomName = `${room.name}new`;

	await loginWithDeepLink(fixtures, user);
	await openRoomScreen(fixtures, 'RoomInfoView', room.name);
	await expectInfoView(fixtures);

	await openEditView(fixtures);
	await expectEditView(fixtures);

	await reopenEditView(fixtures);
	await fillAndResetForm(fixtures);
	await expectFormReset(fixtures, room.name);

	await reopenEditView(fixtures);
	await fillEditField(fixtures, 'name', newRoomName);
	await submitAndReturnToInfo(fixtures);
	await expectInfoText(fixtures, newRoomName);

	await openEditView(fixtures);
	await fillEditFields(fixtures, [
		['topic', 'new topic'],
		['announcement', 'new announcement'],
		['description', 'new description']
	]);
	await submitAndReturnToInfo(fixtures);
	for (const text of ['new description', 'new topic', 'new announcement']) {
		await expectInfoText(fixtures, text);
	}

	await openEditView(fixtures);
	await makeRoomPublic(fixtures);
	await submitEdit(fixtures);
	await expect.poll(async () => (await get(`rooms.info?roomId=${room._id}`, user)).room.t, { timeout: LONG_TIMEOUT }).toBe('c');

	await tapEditControl(fixtures, 'archive');
	await confirmAlert(fixtures, /Do you really want to archive this room/, /^Yes, archive it/i);

	await tapEditControl(fixtures, 'delete');
	await confirmAlert(fixtures, /Deleting a room will delete all messages posted within the room/, /^Yes, delete it/i);

	await navigateToRoomInfo(fixtures, 'roles-test');
	await expectVisible(fixtures, 'user-roles');
	await expectVisible(fixtures, 'user-role-Livechat-Agent');
});
