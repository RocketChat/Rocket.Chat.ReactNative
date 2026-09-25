import * as List from '~/containers/List';
import { ICON_SIZE } from '~/containers/List/constants';
import NativeListRow from '~/containers/NativeListRow';
import RowSeparator from '~/containers/NativeListRow/Separator';
import { AVATAR_SIZE } from '~/containers/NativeListRow/constants';
import Radio from '~/containers/Radio';
import { useTheme } from '~/theme';
import { type ISelectListItem } from './Item';

const Item = ({ name, icon, alert, isRadio, isChecked, accessibilityState, onPress, isFirst, isLast }: ISelectListItem) => {
	const { colors } = useTheme();
	const renderTrailing = () => {
		if (isRadio) {
			return (
				<Radio
					testID={isChecked ? `radio-button-selected-${name}` : `radio-button-unselected-${name}`}
					check={isChecked}
					size={ICON_SIZE}
				/>
			);
		}
		return isChecked ? <List.Icon testID={`${name}-checked`} name='check' color={colors.fontHint} /> : undefined;
	};
	return (
		<>
			{isFirst ? null : <RowSeparator />}
			<NativeListRow
				title={name}
				onPress={onPress}
				testID={`select-list-view-item-${name}`}
				accessibilityLabel={`${name} ${accessibilityState}`}
				isSelected={isChecked}
				isFirst={isFirst}
				isLast={isLast}
				leading={<List.Icon name={icon} color={colors.fontHint} style={{ width: AVATAR_SIZE }} />}
				trailing={alert ? <List.Icon name='info' color={colors.buttonBackgroundDangerDefault} /> : renderTrailing()}
			/>
		</>
	);
};

export default Item;
