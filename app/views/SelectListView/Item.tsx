import * as List from '~/containers/List';
import { ICON_SIZE } from '~/containers/List/constants';
import { type TIconsName } from '~/containers/CustomIcon';
import Radio from '~/containers/Radio';
import { useTheme } from '~/theme';

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
	const renderRight = () => {
		if (isRadio) {
			return (
				<Radio
					testID={isChecked ? `radio-button-selected-${name}` : `radio-button-unselected-${name}`}
					check={isChecked}
					size={ICON_SIZE}
				/>
			);
		}
		return isChecked ? <List.Icon testID={`${name}-checked`} name='check' color={colors.fontHint} /> : null;
	};
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
				right={renderRight}
				additionalAccessibilityLabel={accessibilityState}
			/>
		</>
	);
};

export default Item;
