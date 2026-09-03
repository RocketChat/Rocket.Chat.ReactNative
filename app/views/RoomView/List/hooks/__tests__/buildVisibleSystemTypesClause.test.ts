import { buildVisibleSystemTypesClause } from '../buildVisibleSystemTypesClause';
import { MESSAGE_TYPE_ANY_LOAD } from '../../../../../lib/constants/messageTypeLoad';

describe('buildVisibleSystemTypesClause', () => {
	it('returns null when nothing is hidden', () => {
		expect(buildVisibleSystemTypesClause([])).toBeNull();
	});

	it('keeps rows without a type, load rows, and rows of a type that is not hidden', () => {
		const clause = buildVisibleSystemTypesClause(['uj', 'ul']);

		expect(JSON.parse(JSON.stringify(clause))).toEqual({
			type: 'or',
			conditions: [
				{ type: 'where', left: 't', comparison: { operator: 'eq', right: { value: null } } },
				{ type: 'where', left: 't', comparison: { operator: 'oneOf', right: { values: [...MESSAGE_TYPE_ANY_LOAD] } } },
				{
					type: 'and',
					conditions: [
						{ type: 'where', left: 't', comparison: { operator: 'notEq', right: { value: 'uj' } } },
						{ type: 'where', left: 't', comparison: { operator: 'notEq', right: { value: 'ul' } } }
					]
				}
			]
		});
	});
});
