import { render } from '@testing-library/react-native';
import { Image as ExpoImage } from 'expo-image';

import StatusText from '../StatusText';

describe('StatusText', () => {
	it('does not render direct image markdown', () => {
		const { UNSAFE_queryAllByType } = render(<StatusText msg='![tracker](https://example.com/tracker.png)' />);

		expect(UNSAFE_queryAllByType(ExpoImage)).toHaveLength(0);
	});

	it('does not render an image re-formed by the previous bypass input', () => {
		const { UNSAFE_queryAllByType } = render(<StatusText msg='!![](https://example.com/a.png)[x](https://example.com/b.png)' />);

		expect(UNSAFE_queryAllByType(ExpoImage)).toHaveLength(0);
	});

	it('still renders plain text', () => {
		const { getByText } = render(<StatusText msg='on vacation' />);

		expect(getByText('on vacation')).toBeTruthy();
	});
});
