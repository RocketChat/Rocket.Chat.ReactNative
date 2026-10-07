import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { type EntryExitAnimationFunction } from 'react-native-reanimated';

import SectionHeader from '../SectionHeader';

const noAnimation: EntryExitAnimationFunction = () => ({ initialValues: {}, animations: {} });

const renderSectionHeader = ({ empty = false } = {}) => {
	const onOpen = jest.fn();
	const onToggle = jest.fn();
	render(
		<SectionHeader
			header='catWork'
			title='Work Stuff'
			collapsed={false}
			empty={empty}
			onOpen={onOpen}
			onToggle={onToggle}
			badgeEntering={noAnimation}
			badgeExiting={noAnimation}
		/>
	);
	return { onOpen, onToggle };
};

describe('SectionHeader', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('opens the category with a haptic when the title is pressed', () => {
		const { onOpen } = renderSectionHeader();

		fireEvent.press(screen.getByTestId('rooms-list-section-open-catWork'));

		expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
		expect(onOpen).toHaveBeenCalledWith('catWork', 'Work Stuff');
	});

	it('dims the whole header while the toggle is pressed', () => {
		renderSectionHeader();
		const title = screen.getByTestId('rooms-list-section-open-catWork');
		const toggle = screen.getByTestId('rooms-list-section-catWork');

		fireEvent(toggle, 'pressIn');

		expect(title).toHaveStyle({ opacity: 0.7 });
		expect(toggle).toHaveStyle({ opacity: 0.7 });

		fireEvent(toggle, 'pressOut');

		expect(title).not.toHaveStyle({ opacity: 0.7 });
		expect(toggle).not.toHaveStyle({ opacity: 0.7 });
	});

	it('toggles the category with a light haptic when the toggle is pressed', () => {
		const { onToggle } = renderSectionHeader();
		const pressEvent = {
			currentTarget: {
				measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => callback(0, 100, 300, 48)
			}
		};

		fireEvent.press(screen.getByTestId('rooms-list-section-catWork'), pressEvent);

		expect(onToggle).toHaveBeenCalledWith('catWork', 148);
		expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
	});

	it('ignores the toggle of an empty category but still opens it', () => {
		const { onOpen, onToggle } = renderSectionHeader({ empty: true });

		fireEvent.press(screen.getByTestId('rooms-list-section-catWork'));
		expect(onToggle).not.toHaveBeenCalled();

		fireEvent.press(screen.getByTestId('rooms-list-section-open-catWork'));
		expect(onOpen).toHaveBeenCalledWith('catWork', 'Work Stuff');
	});
});
