import { Host, HStack, Image, Menu, Picker, Spacer, Text } from '@expo/ui/swift-ui';
import {
	accessibilityAddTraits,
	accessibilityElement,
	accessibilityLabel,
	accessibilityValue,
	contentShape,
	font,
	foregroundStyle,
	frame,
	padding,
	shapes,
	tag
} from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';
import { PADDING_HORIZONTAL } from '../constants';
import { useIsNativeList } from '../native/context';
import { ROW_MIN_HEIGHT } from '../native/styles';
import { type IListPicker } from './ListPicker';

const ListPicker = <T extends string>({ children, title, testID, options, selection, onSelectionChange }: IListPicker<T>) => {
	const { colors } = useTheme();
	const isNativeList = useIsNativeList();

	if (!isNativeList) {
		return children;
	}

	const selectedLabel = options.find(option => option.value === selection)?.label ?? '';

	return (
		<Host matchContents={{ vertical: true }} ignoreSafeArea='container'>
			<HStack
				modifiers={[
					accessibilityElement('ignore'),
					accessibilityLabel(title),
					accessibilityValue(selectedLabel),
					accessibilityAddTraits(['isButton'])
				]}>
				<Menu
					testID={testID}
					modifiers={[frame({ maxWidth: Infinity })]}
					label={
						<HStack
							modifiers={[
								padding({ horizontal: PADDING_HORIZONTAL }),
								frame({ maxWidth: Infinity, minHeight: ROW_MIN_HEIGHT }),
								contentShape(shapes.rectangle())
							]}>
							<Text modifiers={[font({ textStyle: 'body', weight: 'medium' }), foregroundStyle(colors.fontDefault)]}>
								{title}
							</Text>
							<Spacer />
							<Text modifiers={[font({ textStyle: 'body' }), foregroundStyle(colors.fontSecondaryInfo)]}>{selectedLabel}</Text>
							<Image
								systemName='chevron.up.chevron.down'
								color={colors.fontSecondaryInfo}
								modifiers={[font({ textStyle: 'footnote', weight: 'semibold' })]}
							/>
						</HStack>
					}>
					<Picker selection={selection} onSelectionChange={onSelectionChange}>
						{options.map(option => (
							<Text key={option.value} testID={option.testID} modifiers={[tag(option.value)]}>
								{option.label}
							</Text>
						))}
					</Picker>
				</Menu>
			</HStack>
		</Host>
	);
};

export default ListPicker;
