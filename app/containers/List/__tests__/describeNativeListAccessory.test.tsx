import { Text, View } from 'react-native';

import Avatar from '../../Avatar';
import { CustomIcon } from '../../CustomIcon';
import NewWindowIcon from '../../NewWindowIcon';
import Radio from '../../Radio';
import Status from '../../Status/Status';
import Switch from '../../Switch';
import ListCheckbox from '../ListCheckbox';
import ListIcon from '../ListIcon';
import { describeNativeListAccessory } from '../describeNativeListAccessory';

describe('describeNativeListAccessory', () => {
	it('has nothing to render for an empty slot', () => {
		expect(describeNativeListAccessory(null)).toBeNull();
	});

	it('maps List.Icon and CustomIcon to icon font glyphs', () => {
		expect(describeNativeListAccessory(<ListIcon name='moon' />)).toEqual({ kind: 'icon', name: 'moon' });
		expect(describeNativeListAccessory(<CustomIcon name='warning' size={20} color='red' />)).toEqual({
			kind: 'icon',
			name: 'warning',
			color: 'red',
			size: 20
		});
	});

	it('ignores an empty icon color', () => {
		expect(describeNativeListAccessory(<ListIcon name='checkbox-unchecked' color='' />)).toEqual({
			kind: 'icon',
			name: 'checkbox-unchecked'
		});
	});

	it('maps the external link icon to the new-window glyph', () => {
		expect(describeNativeListAccessory(<NewWindowIcon />)).toEqual({ kind: 'icon', name: 'new-window' });
	});

	it('shows a checkmark only for a checked radio', () => {
		expect(describeNativeListAccessory(<Radio check />)).toEqual({ kind: 'check' });
		expect(describeNativeListAccessory(<Radio check={false} />)).toBeNull();
	});

	it('maps the user status', () => {
		expect(describeNativeListAccessory(<Status status='away' size={24} />)).toEqual({ kind: 'status', status: 'away' });
	});

	it('maps a Switch to a toggle keeping value, handler and disabled state', () => {
		const onValueChange = jest.fn();
		const accessory = describeNativeListAccessory(<Switch value onValueChange={onValueChange} disabled testID='switch' />);
		expect(accessory).toEqual({ kind: 'toggle', isOn: true, onValueChange, disabled: true, testID: 'switch' });
	});

	it('maps List.Checkbox to a checkbox keeping value, handler and testID', () => {
		const onValueChange = jest.fn();
		expect(describeNativeListAccessory(<ListCheckbox value onValueChange={onValueChange} testID='checkbox' />)).toEqual({
			kind: 'checkbox',
			value: true,
			onValueChange,
			testID: 'checkbox'
		});
	});

	it('maps plain text, also when wrapped in a single View', () => {
		expect(describeNativeListAccessory(<Text>Off</Text>)).toEqual({ kind: 'text', text: 'Off' });
		expect(
			describeNativeListAccessory(
				<View>
					<Text>Toasts</Text>
				</View>
			)
		).toEqual({ kind: 'text', text: 'Toasts' });
	});

	it('hosts anything else as React Native', () => {
		const avatar = <Avatar text='diego' size={36} />;
		expect(describeNativeListAccessory(avatar)).toEqual({ kind: 'hosted', element: avatar });
	});
});
