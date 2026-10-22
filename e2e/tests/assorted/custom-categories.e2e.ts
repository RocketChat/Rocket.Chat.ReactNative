import { afterEach, test } from '~e2e/support/fixtures';
import { expect } from 'e2e';

import { createCategory, createRandomRoom, createUser, deleteCreatedUsers, randomCategoryName } from '~e2e/support/api';
import { openRoom } from '~e2e/support/appduct';
import {
	expectCategoryDeleted,
	expectCategoryNamed,
	expectListedInCategoryView,
	expectRoomInCategory,
	fillCategoryName,
	findCategoryByName,
	groupRoomsByCategory,
	moveOpenRoomToCategory,
	openCategory,
	openCategorySettings
} from '~e2e/support/categories';
import {
	backToRoomsList,
	confirmAlert,
	expectHidden,
	expectVisible,
	LONG_TIMEOUT,
	loginWithDeepLink,
	openRoomActions,
	scrollAndTap,
	tapWhenVisible
} from '~e2e/support/flows';
import { tapHeaderItem } from '~e2e/support/header';
import { openNewMessage } from '~e2e/support/room';

afterEach(deleteCreatedUsers);

test('creates a category with a room from Create new', { tags: ['test-1'] }, async fixtures => {
	const user = await createUser();
	const room = await createRandomRoom(user);
	const categoryName = randomCategoryName();

	await loginWithDeepLink(fixtures, user);
	await openNewMessage(fixtures);
	await tapWhenVisible(fixtures, 'new-message-view-create-category');
	await expectVisible(fixtures, 'create-category-view');
	await fillCategoryName(fixtures, categoryName);
	await tapHeaderItem(fixtures, 'create-category-view-next', 'Next');

	await expectVisible(fixtures, 'category-rooms-view');
	await tapWhenVisible(fixtures, `create-category-room-${room.name}`);
	await expectVisible(fixtures, `create-category-selected-room-${room.name}`);
	await tapHeaderItem(fixtures, 'category-rooms-view-next', 'Next');

	await expectVisible(fixtures, 'confirm-category-view');
	await tapWhenVisible(fixtures, 'confirm-category-view-create');
	await expectVisible(fixtures, 'rooms-list-view');

	await expectCategoryNamed(user, categoryName);
	const category = (await findCategoryByName(user, categoryName))!;
	await expectRoomInCategory(user, room._id, category._id);

	await openCategory(fixtures, category._id);
	await expectListedInCategoryView(fixtures, room.name);
});

test('moves a room to a category, collapses, renames and deletes it', { tags: ['test-1'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const room = await createRandomRoom(user);
	const category = await createCategory(user);
	const newName = randomCategoryName();
	const roomRow = `rooms-list-view-item-${room.name}`;

	await loginWithDeepLink(fixtures, user);
	await groupRoomsByCategory(fixtures);
	await openRoom(fixtures, room.name);
	await openRoomActions(fixtures);
	await moveOpenRoomToCategory(fixtures, category._id);
	await expectRoomInCategory(user, room._id, category._id);
	await expect(screen.getByLabel(new RegExp(`^Category.*${category.name}`))).toBeVisible({ timeout: LONG_TIMEOUT });

	await backToRoomsList(fixtures);
	await expectVisible(fixtures, roomRow);
	await tapWhenVisible(fixtures, `rooms-list-section-${category._id}`);
	await expectHidden(fixtures, roomRow);
	await tapWhenVisible(fixtures, `rooms-list-section-${category._id}`);
	await expectVisible(fixtures, roomRow);

	await openCategory(fixtures, category._id);
	await expectListedInCategoryView(fixtures, room.name);
	await openCategorySettings(fixtures);
	await tapWhenVisible(fixtures, 'category-settings-view-rename');
	await expectVisible(fixtures, 'rename-category-view');
	await fillCategoryName(fixtures, newName);
	await tapWhenVisible(fixtures, 'rename-category-view-save');
	await expectVisible(fixtures, 'category-settings-view');
	await expectCategoryNamed(user, newName);

	await scrollAndTap(screen.getByTestId('category-settings-view-list'), screen.getByTestId('category-settings-view-delete'));
	await confirmAlert(fixtures, /will move back to default groups/, /^Delete$/i);
	await expectVisible(fixtures, 'rooms-list-view');
	await expectCategoryDeleted(user, category._id);
	await expectRoomInCategory(user, room._id, undefined);
	await expectHidden(fixtures, `rooms-list-section-${category._id}`);
	await expectVisible(fixtures, roomRow);
});
