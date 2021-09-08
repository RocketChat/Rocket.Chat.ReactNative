import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export default class CannedResponses extends Model {
	static table = 'canned_responses';

  @field('text') text;

  @field('scope') scope;

  @field('department_id') departmentId;

  @field('created_by') createdBy;

  @json('tags', sanitizer) tags;
}
