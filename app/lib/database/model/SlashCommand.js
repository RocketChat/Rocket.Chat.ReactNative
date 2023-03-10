import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export const SLASH_COMMANDS_TABLE = 'slash_commands';

export default class SlashCommand extends Model {
	static table = SLASH_COMMANDS_TABLE;

	@field('params') params;

	@field('description') description;

	@field('client_only') clientOnly;

	@field('provides_preview') providesPreview;

	@field('app_id') appId;
}
