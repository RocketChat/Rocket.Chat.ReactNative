import { type StyleProp, type ViewStyle } from 'react-native';

import Avatar from './Avatar';
import { CustomIcon, type TIconsName } from './CustomIcon';
import NativeListRow from './NativeListRow';
import { AVATAR_SIZE } from './NativeListRow/constants';
import { useTheme } from '../theme';
import i18n from '../i18n';

interface IUserItem {
	name: string;
	username: string;
	onPress(): void;
	testID: string;
	onLongPress?: () => void;
	style?: StyleProp<ViewStyle>;
	icon?: TIconsName | null;
	iconColor?: string;
	isChecked?: boolean;
	isFirst?: boolean;
	isLast?: boolean;
}

const UserItem = ({ name, username, onPress, testID, onLongPress, icon, iconColor, isChecked, isFirst, isLast }: IUserItem) => {
	const { colors } = useTheme();
	const label = icon ? `${name} ${isChecked ? i18n.t('Selected') : i18n.t('Unselected')}` : name;
	return (
		<NativeListRow
			title={name}
			onPress={onPress}
			onLongPress={onLongPress}
			testID={testID}
			accessibilityLabel={label}
			isSelected={isChecked}
			isFirst={isFirst}
			isLast={isLast}
			leading={<Avatar text={username} size={AVATAR_SIZE} />}
			trailing={icon ? <CustomIcon name={icon} size={22} color={iconColor || colors.fontHint} /> : undefined}
		/>
	);
};

export default UserItem;
