import * as List from '~/containers/List';
import NativeListRow from '~/containers/NativeListRow';
import RowSeparator from '~/containers/NativeListRow/components/Separator';
import { AVATAR_SIZE } from '~/containers/NativeListRow/constants';
import { useTheme } from '~/theme';
import { type ISelectListItem } from './Item';
import SelectionIndicator from './SelectionIndicator';

const Item = ({ name, icon, alert, isRadio, isChecked, accessibilityState, onPress, isFirst, isLast }: ISelectListItem) => {
	const { colors } = useTheme();
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
				trailing={
					alert ? (
						<List.Icon name='info' color={colors.buttonBackgroundDangerDefault} />
					) : (
						<SelectionIndicator name={name} isRadio={isRadio} isChecked={isChecked} />
					)
				}
			/>
		</>
	);
};

export default Item;
