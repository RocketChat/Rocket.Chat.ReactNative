import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Command extends Model {
	static table = 'slash_commands';

  @field('command') command;

  @field('params') params;

  @field('description') description;

  @field('client_only') clientOnly;

  @field('provides_preview') providesPreview;
}
