import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { Icon, resolveIconName } from './Icon';

const mockHasIcon = jest.fn();
const mockCustomIcon = jest.fn(() => <Text testID='custom-icon'>icon</Text>);

jest.mock('../CustomIcon', () => ({
	hasIcon: (...args: unknown[]) => mockHasIcon(...args),
	CustomIcon: (...props: Parameters<typeof mockCustomIcon>) => mockCustomIcon(...props)
}));

jest.mock('../../theme', () => ({
	useTheme: () => ({
		colors: {
			fontDefault: '#000000',
			fontDanger: '#d00000',
			fontSecondaryInfo: '#0060d0',
			statusFontWarning: '#d09000',
			statusFontDanger: '#ff2020',
			surfaceTint: '#f2f2f2'
		}
	})
}));

describe('UIKit Icon', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('resolveIconName', () => {
		it('returns original icon when available', () => {
			mockHasIcon.mockImplementation((name: string) => name === 'bell');

			expect(resolveIconName('bell')).toBe('bell');
		});

		it('resolves known alias when alias icon exists', () => {
			mockHasIcon.mockImplementation((name: string) => name === 'phone-off');

			expect(resolveIconName('phone-end')).toBe('phone-off');
		});

		it('falls back to info when icon and alias are unavailable', () => {
			mockHasIcon.mockReturnValue(false);

			expect(resolveIconName('unknown')).toBe('info');
		});
	});

	it('renders secondary variant color', () => {
		mockHasIcon.mockReturnValue(true);
		render(<Icon element={{ icon: 'bell', type: 'icon', variant: 'secondary' } as any} />);

		expect(mockCustomIcon).toHaveBeenCalledTimes(1);
		const firstCallArg = (mockCustomIcon.mock.calls[0] as any[])[0];
		expect(firstCallArg).toEqual(
			expect.objectContaining({
				name: 'bell',
				color: '#0060d0',
				size: 20
			})
		);
	});

	it('uses framed danger color and frame background', () => {
		mockHasIcon.mockReturnValue(true);
		const { toJSON } = render(<Icon element={{ icon: 'bell', type: 'icon', variant: 'danger', framed: true } as any} />);

		expect(mockCustomIcon).toHaveBeenCalledTimes(1);
		const firstCallArg = (mockCustomIcon.mock.calls[0] as any[])[0];
		expect(firstCallArg).toEqual(
			expect.objectContaining({
				name: 'bell',
				color: '#ff2020',
				size: 20
			})
		);
		expect(toJSON()).toMatchObject({
			props: {
				style: expect.arrayContaining([expect.objectContaining({ backgroundColor: '#f2f2f2' })])
			}
		});
	});
});
