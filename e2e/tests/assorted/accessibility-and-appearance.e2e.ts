import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { expectTexts, goBackUntil, loginWithDeepLink, LONG_TIMEOUT } from '~e2e/support/flows';
import { goToAccessibilityAndAppearance, toggleAccessibilitySwitchAndOpenRoom } from '~e2e/support/settings';

const MENTIONS_SWITCH = 'accessibility-mentions-with-at-symbol-switch';
const HASHTAG_SWITCH = 'accessibility-rooms-with-hashtag-symbol-switch';

const SYMBOL_TOGGLES = [
	[MENTIONS_SWITCH, ['@all - all mention', '@rocket.cat - user mention']],
	[MENTIONS_SWITCH, ['all - all mention', 'rocket.cat - user mention']],
	[HASHTAG_SWITCH, ['#general - channel mention']],
	[HASHTAG_SWITCH, ['general - channel mention']]
] as const;

afterEach(deleteCreatedUsers);

test(
	'toggles mention and room symbols from accessibility and appearance',
	{ tags: ['test-8'], platforms: ['android'], timeout: 600_000 },
	async fixtures => {
		const { screen } = fixtures;
		const user = await createUser();
		await loginWithDeepLink(fixtures, user);
		await goToAccessibilityAndAppearance(fixtures);

		for (const testId of [
			'accessibility-view-drawer',
			'accessibility-theme-button',
			'accessibility-display-button',
			HASHTAG_SWITCH,
			MENTIONS_SWITCH,
			'accessibility-autoplay-gifs-switch'
		]) {
			await expect(screen.getByTestId(testId)).toBeVisible({ timeout: LONG_TIMEOUT });
		}

		for (const [switchTestId, texts] of SYMBOL_TOGGLES) {
			await toggleAccessibilitySwitchAndOpenRoom(fixtures, switchTestId);
			await expectTexts(fixtures, texts);
			await goBackUntil(fixtures, 'rooms-list-view');
			await goToAccessibilityAndAppearance(fixtures);
		}
	}
);
