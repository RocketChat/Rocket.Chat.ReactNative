import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { ScrollView } from 'react-native';

import SectionPills from '../SectionPills';

const sections = [
	{ header: 'Unread', title: 'Unread' },
	{ header: 'catWork', title: 'Work Stuff' }
];

describe('SectionPills', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('marks only the current section as selected', () => {
		render(<SectionPills sections={sections} selectedHeader='catWork' onSelect={jest.fn()} />);

		expect(screen.getByTestId('category-view-section-catWork')).toBeSelected();
		expect(screen.getByTestId('category-view-section-Unread')).not.toBeSelected();
	});

	it('selects a section with a haptic when its pill is pressed', () => {
		const onSelect = jest.fn();
		render(<SectionPills sections={sections} selectedHeader='catWork' onSelect={onSelect} />);

		fireEvent.press(screen.getByTestId('category-view-section-Unread'));

		expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
		expect(onSelect).toHaveBeenCalledWith('Unread', 'Unread');
	});

	it('scrolls to the opened section only on its first layout', () => {
		const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => undefined);
		const layoutAt = (x: number) => ({ nativeEvent: { layout: { x, y: 0, width: 80, height: 40 } } });
		const { rerender } = render(<SectionPills sections={sections} selectedHeader='catWork' onSelect={jest.fn()} />);

		fireEvent(screen.getByTestId('category-view-section-catWork'), 'layout', layoutAt(100));
		rerender(
			<SectionPills
				sections={[{ header: 'Favorites', title: 'Favorites' }, ...sections]}
				selectedHeader='Unread'
				onSelect={jest.fn()}
			/>
		);
		fireEvent(screen.getByTestId('category-view-section-catWork'), 'layout', layoutAt(200));

		expect(scrollTo.mock.calls).toEqual([[{ x: 84, animated: false }]]);
	});
});
