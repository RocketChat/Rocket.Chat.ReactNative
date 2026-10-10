import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import SectionPills from '../SectionPills';

const sections = [
	{ header: 'Unread', title: 'Unread' },
	{ header: 'catWork', title: 'Work Stuff' }
];

describe('SectionPills', () => {
	beforeEach(() => {
		jest.clearAllMocks();
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
});
