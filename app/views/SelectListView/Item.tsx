import * as List from '~/containers/List';
import { type TIconsName } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';
import SelectionIndicator from './SelectionIndicator';

export interface ISelectListItem {
	name: string;
	icon: TIconsName;
	alert?: boolean;
	isRadio?: boolean;
	isChecked: boolean;
	accessibilityState: string;
	onPress: () => void;
	isFirst: boolean;
	isLast: boolean;
}

const Item = ({ name, icon, alert, isRadio, isChecked, accessibilityState, onPress }: ISelectListItem) => {
	const { colors } = useTheme();
	return (
		<>
			<List.Separator />
			<List.Item
				title={name}
				translateTitle={false}
				testID={`select-list-view-item-${name}`}
				onPress={onPress}
				alert={alert}
				left={() => <List.Icon name={icon} color={colors.fontHint} />}
				right={() => <SelectionIndicator name={name} isRadio={isRadio} isChecked={isChecked} />}
				additionalAccessibilityLabel={accessibilityState}
			/>
		</>
	);
};

export default Item;
