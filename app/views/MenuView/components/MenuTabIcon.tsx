import { View } from 'react-native';

import { CustomIcon } from '~/containers/CustomIcon';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';

const MenuTabIcon = ({ color, size, badgeColor }: { color: string; size: number; badgeColor?: string }) => (
	<View>
		<CustomIcon name='hamburguer' color={color} size={size} />
		{badgeColor ? <HeaderButton.BadgeWarn color={badgeColor} /> : null}
	</View>
);

export default MenuTabIcon;
