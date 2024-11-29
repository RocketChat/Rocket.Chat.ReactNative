import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export const APP_ACTION_BUTTON_TABLE = 'app_actions_buttons';

export default class AppActionButton extends Model {
	static table = APP_ACTION_BUTTON_TABLE;

	@field('app_id') appId!: string;

	@field('action_id') actionId!: string;

	@field('context') context!: string;

	@field('label_i18n') labelI18n!: string;

	@field('variant') variant!: string;

	@field('category') category!: string;

	@json('when', sanitizer) when!: string;

	asPlain() {
		return {
			appId: this.appId,
			actionId: this.actionId,
			context: this.context,
			labelI18n: this.labelI18n,
			variant: this.variant,
			category: this.category,
			when: this.when
		};
	}
}
