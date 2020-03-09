import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class SlashCommand extends Model {
	static table = 'slash_commands';

  @field('params') params;

  @field('description') description;

  @field('client_only') clientOnly;

  @field('provides_preview') providesPreview;

  @field('app_id') appId;
}
