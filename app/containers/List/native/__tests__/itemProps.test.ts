import EventEmitter from '~/lib/methods/helpers/events';
import { LISTENER } from '~/containers/Toast';
import { type IListItem } from '../../ListItem';
import { nativeListItemAccessibilityLabel, nativeListItemTitle, pressNativeListItem } from '../itemProps';

jest.mock('~/i18n', () => ({ t: (key: string) => `t:${key}` }));

describe('nativeListItemTitle', () => {
	it('translates string titles', () => {
		expect(nativeListItemTitle({ title: 'Theme' })).toBe('t:Theme');
	});

	it('has no text for custom title components', () => {
		expect(nativeListItemTitle({ title: () => null })).toBeUndefined();
	});
});

describe('nativeListItemAccessibilityLabel', () => {
	it('prefers the explicit label', () => {
		expect(nativeListItemAccessibilityLabel({ title: 'Theme', accessibilityLabel: 'Custom' })).toBe('Custom');
	});

	it('joins translated title, subtitle and switch state', () => {
		expect(
			nativeListItemAccessibilityLabel({
				title: 'Crash_report',
				subtitle: 'Info',
				translateSubtitle: false,
				additionalAccessibilityLabel: true
			})
		).toBe('t:Crash_report Info t:Enabled');
	});

	it('uses checked wording for checkboxes', () => {
		expect(
			nativeListItemAccessibilityLabel({
				title: 'Name',
				translateTitle: false,
				additionalAccessibilityLabel: false,
				additionalAccessibilityLabelCheck: true
			})
		).toBe('Name t:Unchecked');
	});
});

describe('pressNativeListItem', () => {
	const onPress = jest.fn();
	const item: IListItem = { title: 'Theme', onPress };

	beforeEach(() => onPress.mockClear());

	it('calls onPress with the title', () => {
		pressNativeListItem(item);
		expect(onPress).toHaveBeenCalledWith('Theme');
	});

	it('ignores presses on disabled rows', () => {
		pressNativeListItem({ title: 'Theme', onPress, disabled: true });
		expect(onPress).not.toHaveBeenCalled();
	});

	it('shows the disabled reason instead of pressing', () => {
		const emit = jest.spyOn(EventEmitter, 'emit');
		pressNativeListItem({ title: 'Theme', onPress, disabled: true, disabledReason: 'Not allowed' });
		expect(emit).toHaveBeenCalledWith(LISTENER, { message: 'Not allowed' });
		expect(onPress).not.toHaveBeenCalled();
	});
});
