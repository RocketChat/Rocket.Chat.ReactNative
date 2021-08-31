import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class CannedResponses extends Model {
	static table = 'canned_responses';

  @field('text') text;

  @field('scope') scope;

  @field('department_id') departmentId;

  @field('created_by') createdBy;
}
