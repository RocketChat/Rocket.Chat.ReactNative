import { asNativeListSection, isNativeListRow, isNativeListSection } from '../rowMarkers';

describe('asNativeListSection', () => {
	it('marks a component as a whole section rather than a row', () => {
		const CallRows = asNativeListSection(() => null);
		expect(isNativeListSection(CallRows)).toBe(true);
		expect(isNativeListRow(CallRows)).toBe(false);
		expect(isNativeListSection(() => null)).toBe(false);
	});
});
