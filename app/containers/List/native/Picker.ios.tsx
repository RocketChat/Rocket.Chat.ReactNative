import { Picker, Text } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame, listRowInsets, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { BASE_HEIGHT, PADDING_HORIZONTAL } from '../constants';
import { type INativeListPicker } from './Picker';

const NativeListPicker = ({ title, testID, options, selection, onSelectionChange }: INativeListPicker) => {
	const { colors } = useTheme();
	const { fontScale } = useResponsiveLayout();

	return (
		<Picker
			testID={testID}
			selection={selection}
			onSelectionChange={onSelectionChange}
			label={
				<Text modifiers={[font({ textStyle: 'body', weight: 'medium' }), foregroundStyle(colors.fontDefault)]}>{title}</Text>
			}
			modifiers={[
				pickerStyle('menu'),
				tint(colors.fontSecondaryInfo),
				frame({ minHeight: BASE_HEIGHT * fontScale }),
				listRowInsets({ leading: PADDING_HORIZONTAL, trailing: PADDING_HORIZONTAL })
			]}>
			{options.map(option => (
				<Text key={option.value} testID={option.testID} modifiers={[tag(option.value)]}>
					{option.label}
				</Text>
			))}
		</Picker>
	);
};

export default NativeListPicker;
