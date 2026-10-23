import { expect } from 'e2e';

import { getRoomCategory, getSidebarCategories, type Credentials, type SidebarCategory } from './api';
import {
	escapeRegExp,
	expectVisible,
	fillSettled,
	type Fixtures,
	isVisibleNow,
	LONG_TIMEOUT,
	scrollAndTap,
	succeeds,
	tapWhenVisible
} from './flows';
import { tapHeaderItem } from './header';
import { closeActionSheet } from './teams';

export const groupRoomsByCategory = (fixtures: Fixtures) =>
	fixtures.appduct.call('set_preference', { name: 'groupByType', value: true });

export const fillCategoryName = (fixtures: Fixtures, name: string) =>
	fillSettled(fixtures.screen.getByTestId('create-category-name'), name);

export const openCategory = async (fixtures: Fixtures, categoryId: string) => {
	await tapWhenVisible(fixtures, `rooms-list-section-open-${categoryId}`);
	await expectVisible(fixtures, 'category-view');
};

export const expectListedInCategoryView = ({ screen }: Fixtures, roomName: string) =>
	expect(screen.getByTestId('category-view').getByTestId(`rooms-list-view-item-${roomName}`)).toBeVisible({
		timeout: LONG_TIMEOUT
	});

export const openCategorySettings = async (fixtures: Fixtures) => {
	await tapHeaderItem(fixtures, 'category-view-options', 'Category options');
	await expectVisible(fixtures, 'category-settings-view');
};

const MOVE_TAP_ATTEMPTS = 3;
const MOVE_RESPONSE_TIMEOUT = 5_000;

export const moveOpenRoomToCategory = async (fixtures: Fixtures, category: SidebarCategory) => {
	const { screen } = fixtures;
	const sheet = screen.getByTestId('move-to-category-sheet');
	const option = screen.getByTestId(`move-to-category-${category._id}`);
	const selected = screen.getByLabel(new RegExp(`^${escapeRegExp(category.name)} Checked$`));
	await scrollAndTap(screen.getByTestId('room-actions-scrollview'), screen.getByTestId('room-actions-category'));
	await expect(option).toBeVisible({ timeout: LONG_TIMEOUT });
	for (let attempt = 1; attempt <= MOVE_TAP_ATTEMPTS; attempt += 1) {
		if (!(await isVisibleNow(sheet)) || (await isVisibleNow(selected))) {
			break;
		}
		await option.tap();
		await succeeds(expect(sheet).toBeHidden({ timeout: MOVE_RESPONSE_TIMEOUT }));
	}
	if (await isVisibleNow(sheet)) {
		await closeActionSheet(fixtures);
	}
};

export const findCategoryByName = async (credentials: Credentials, name: string) =>
	(await getSidebarCategories(credentials)).find(category => category.name === name);

export const expectCategoryNamed = (credentials: Credentials, name: string) =>
	expect.poll(async () => (await findCategoryByName(credentials, name)) !== undefined, { timeout: LONG_TIMEOUT }).toBe(true);

export const expectCategoryRenamed = (credentials: Credentials, categoryId: string, name: string) =>
	expect
		.poll(async () => (await getSidebarCategories(credentials)).find(category => category._id === categoryId)?.name, {
			timeout: LONG_TIMEOUT
		})
		.toBe(name);

export const expectCategoryDeleted = (credentials: Credentials, categoryId: string) =>
	expect
		.poll(async () => (await getSidebarCategories(credentials)).some(category => category._id === categoryId), {
			timeout: LONG_TIMEOUT
		})
		.toBe(false);

export const expectRoomInCategory = (credentials: Credentials, roomId: string, categoryId: string | undefined) =>
	expect.poll(() => getRoomCategory(credentials, roomId), { timeout: LONG_TIMEOUT }).toBe(categoryId);
