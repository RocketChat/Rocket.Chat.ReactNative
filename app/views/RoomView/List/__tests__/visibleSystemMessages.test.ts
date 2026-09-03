import { buildVisibleSystemTypesClause, isHiddenSystemMessage, isLoaderMessage } from '../visibleSystemMessages';
import { MESSAGE_TYPE_ANY_LOAD, MessageTypeLoad } from '../../../../lib/constants/messageTypeLoad';

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

describe('isLoaderMessage', () => {
	it('matches every load type', () => {
		expect(MESSAGE_TYPE_ANY_LOAD.every(t => isLoaderMessage({ t }))).toBe(true);
	});

	it('rejects plain and system messages', () => {
		expect(isLoaderMessage({})).toBe(false);
		expect(isLoaderMessage({ t: 'uj' })).toBe(false);
	});
});

describe('isHiddenSystemMessage', () => {
	it('hides a system message whose type is configured as hidden', () => {
		expect(isHiddenSystemMessage({ t: 'uj' }, ['uj', 'ul'])).toBe(true);
	});

	it('keeps a system message of a type that is not hidden', () => {
		expect(isHiddenSystemMessage({ t: 'au' }, ['uj'])).toBe(false);
	});

	it('keeps plain messages and loaders regardless of the hidden types', () => {
		expect(isHiddenSystemMessage({}, ['uj'])).toBe(false);
		expect(isHiddenSystemMessage({ t: MessageTypeLoad.MORE }, [MessageTypeLoad.MORE])).toBe(false);
	});
});
