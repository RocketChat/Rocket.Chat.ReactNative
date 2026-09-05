import { render } from '@testing-library/react-native';

import Preview from './Preview';

jest.mock('@react-navigation/elements', () => ({
	useHeaderHeight: () => 0
}));

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock('expo-av', () => ({
	ResizeMode: { CONTAIN: 'contain' },
	Video: () => null
}));

jest.mock('../../containers/ImageViewer', () => ({
	ImageViewer: () => null
}));

describe('Preview', () => {
	it('falls back to the generic file preview when mime is a non-string falsy value', () => {
		// react-native-mime-types returns `false` (not undefined) for unrecognized extensions,
		// so `type?.match` must not be assumed to short-circuit on it.
		const item = {
			filename: 'build.prop',
			path: '/system/build.prop',
			size: 42,
			mime: false as unknown as string,
			canUpload: true
		};

		expect(() => render(<Preview item={item as any} theme='light' length={1} />)).not.toThrow();

		const { getByText } = render(<Preview item={item as any} theme='light' length={1} />);
		expect(getByText('build.prop')).toBeTruthy();
	});
});
