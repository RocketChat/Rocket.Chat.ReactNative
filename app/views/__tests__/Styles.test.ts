import { Platform } from 'react-native';

const loadStylesOn = (os: typeof Platform.OS, version: number) => {
	let styles: typeof import('../Styles').default | undefined;
	jest.isolateModules(() => {
		const { Platform: isolatedPlatform } = jest.requireActual<typeof import('react-native')>('react-native');
		Object.defineProperty(isolatedPlatform, 'OS', { get: () => os, configurable: true });
		Object.defineProperty(isolatedPlatform, 'Version', { get: () => version, configurable: true });
		styles = jest.requireActual<typeof import('../Styles')>('../Styles').default;
	});
	if (!styles) throw new Error('Styles did not load');
	return styles;
};

describe('Inter text weights', () => {
	it('uses the per-weight families for medium and semibold below Android 9, where RN drops weights 500 and 600', () => {
		const styles = loadStylesOn('android', 27);
		expect(styles.textMedium).toMatchObject({ fontFamily: 'Inter-Medium' });
		expect(styles.textMedium).not.toHaveProperty('fontWeight');
		expect(styles.textSemibold).toMatchObject({ fontFamily: 'Inter-SemiBold' });
		expect(styles.textSemibold).not.toHaveProperty('fontWeight');
	});

	it.each([
		['android', 28],
		['ios', 18]
	] as const)('selects medium and semibold by weight on %s %s', (os, version) => {
		const styles = loadStylesOn(os, version);
		expect(styles.textMedium).toMatchObject({ fontFamily: 'Inter', fontWeight: '500' });
		expect(styles.textSemibold).toMatchObject({ fontFamily: 'Inter', fontWeight: '600' });
	});
});
