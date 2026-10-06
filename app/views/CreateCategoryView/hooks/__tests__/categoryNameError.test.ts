import { getCategoryNameError, MAX_CATEGORY_NAME_LENGTH } from '../categoryNameError';

describe('getCategoryNameError', () => {
	it('accepts a new name', () => {
		expect(getCategoryNameError('Design', ['Work'])).toBeUndefined();
	});

	it('rejects a name longer than the server limit', () => {
		expect(getCategoryNameError('a'.repeat(MAX_CATEGORY_NAME_LENGTH + 1), [])).toBe(
			'Category name is too long (max 30 characters)'
		);
	});

	it('measures the limit after trimming surrounding spaces', () => {
		expect(getCategoryNameError(`  ${'a'.repeat(MAX_CATEGORY_NAME_LENGTH)}  `, [])).toBeUndefined();
	});

	it('rejects the label of a system group regardless of case', () => {
		expect(getCategoryNameError('favorites', [])).toBe('This name is reserved for a system group');
		expect(getCategoryNameError('Chats', [])).toBe('This name is reserved for a system group');
	});

	it('rejects a name already used by another category regardless of case and spaces', () => {
		expect(getCategoryNameError(' design ', ['Design'])).toBe('A category with this name already exists');
	});
});
