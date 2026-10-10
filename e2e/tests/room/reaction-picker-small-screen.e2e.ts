import { afterEach, test } from '@e2e-dev/mobile';

import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	loginWithDeepLink,
	navigateToRoom,
	sendMessage,
	type Fixtures,
	tapWhenVisible,
	expectVisible,
	openMessageActions
} from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

const MAX_PICKER_SWIPES = 30;

const scrollPickerUntilVisible = async ({ screen }: Fixtures, testId: string) => {
	const target = screen.getByTestId(testId);
	for (let swipe = 0; swipe < MAX_PICKER_SWIPES && !(await target.isVisible()); swipe += 1) {
		await screen.getByTestId('action-sheet').swipe({ direction: 'down' });
	}
};

test(
	'reaches the last emoji of the people category on small screens',
	{ tags: ['test-10'], platforms: ['ios'] },
	async fixtures => {
		const message = 'random-message';
		const user = await createUser();
		const room = await createRandomRoom(user);

		await loginWithDeepLink(fixtures, user);
		await navigateToRoom(fixtures, room.name);
		await sendMessage(fixtures, message);

		await openMessageActions(fixtures, message);
		await tapWhenVisible(fixtures, 'add-reaction');
		await expectVisible(fixtures, 'reaction-picker');
		await tapWhenVisible(fixtures, 'emoji-picker-tab-emoji');
		await scrollPickerUntilVisible(fixtures, 'emoji-footprints');
		await tapWhenVisible(fixtures, 'emoji-footprints');
		await expectVisible(fixtures, 'message-reaction-:footprints:');
	}
);
