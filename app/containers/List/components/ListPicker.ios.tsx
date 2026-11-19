import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { labelsHidden, offset, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';
import NativeListItem from '../native/components/Item';
import { useIsNativeList } from '../native/context';
import { type IListPicker } from './ListPicker';

const MENU_BUTTON_CONTENT_INSET = 12;

const ListPicker = <T extends string>({ children, title, testID, options, selection, onSelectionChange }: IListPicker<T>) => {
	const { colors } = useTheme();
	const isNativeList = useIsNativeList();

	if (!isNativeList) {
		return children;
	}

	return (
		<NativeListItem
			item={{
				title,
				translateTitle: false,
				right: () => (
					<Host matchContents>
						<Picker
							testID={testID}
							selection={selection}
							onSelectionChange={onSelectionChange}
							label={<Text>{title}</Text>}
							modifiers={[
								pickerStyle('menu'),
								labelsHidden(),
								tint(colors.fontSecondaryInfo),
								offset({ x: MENU_BUTTON_CONTENT_INSET })
							]}>
							{options.map(option => (
								<Text key={option.value} testID={option.testID} modifiers={[tag(option.value)]}>
									{option.label}
								</Text>
							))}
						</Picker>
					</Host>
				)
			}}
		/>
	);
};

export default ListPicker;
