import { createElement } from 'react';
import { View } from 'react-native';

import EventEmitter from '~/lib/methods/helpers/events';
import { LISTENER } from '../../Toast';
import ListItem from '../ListItem';
import ListRadio from '../ListRadio';
import {
	type INativeListItem,
	nativeListItemAccessibilityLabel,
	pressNativeListItem,
	toNativeListItem
} from '../nativeListItemProps';

jest.mock('~/i18n', () => ({ t: (key: string) => `t:${key}` }));

describe('toNativeListItem', () => {
	it('maps a List.Item with a string title', () => {
		expect(toNativeListItem(createElement(ListItem, { title: 'Theme', testID: 'theme' }))).toMatchObject({
			title: 'Theme',
			testID: 'theme'
		});
	});

	it('keeps a List.Item with a custom title component hosted', () => {
		expect(toNativeListItem(createElement(ListItem, { title: () => null }))).toBeNull();
	});

	it('keeps other rows hosted', () => {
		expect(toNativeListItem(createElement(View))).toBeNull();
	});

	it('maps a List.Radio to a row with a radio accessory and selection label', () => {
		const item = toNativeListItem(createElement(ListRadio, { title: 'English', value: 'en', isSelected: true }));
		expect(item?.right).toBeInstanceOf(Function);
		expect(item?.additionalAccessibilityLabel).toBe('t:Selected');
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
	const item: INativeListItem = { title: 'Theme', onPress };

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
