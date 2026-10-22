import { expect } from 'e2e';

import { getRoomCategory, getSidebarCategories, type Credentials } from './api';
import { expectVisible, fillSettled, type Fixtures, LONG_TIMEOUT, scrollAndTap, tapUntilHidden, tapWhenVisible } from './flows';
import { tapHeaderItem } from './header';

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

export const moveOpenRoomToCategory = async (fixtures: Fixtures, categoryId: string) => {
	const { screen } = fixtures;
	await scrollAndTap(screen.getByTestId('room-actions-scrollview'), screen.getByTestId('room-actions-category'));
	await expectVisible(fixtures, `move-to-category-${categoryId}`);
	await tapUntilHidden(fixtures, `move-to-category-${categoryId}`, 'move-to-category-sheet');
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
