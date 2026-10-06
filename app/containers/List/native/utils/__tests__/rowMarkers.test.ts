import { asNativeListSection, isNativeListSection } from '../rowMarkers';

describe('asNativeListSection', () => {
	it('marks a component as a whole section', () => {
		const CallRows = asNativeListSection(() => null);
		expect(isNativeListSection(CallRows)).toBe(true);
		expect(isNativeListSection(() => null)).toBe(false);
	});
});
