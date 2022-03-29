import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';

import { themes } from '../../../constants/colors';
import { CustomIcon, TIconsName } from '../../CustomIcon';
import styles from '../styles';
import I18n from '../../../i18n';

interface IBaseButton {
	theme: string;
	onPress(): void;
	testID: string;
	accessibilityLabel: string;
	icon: TIconsName;
	color?: string;
}

const BaseButton = React.memo(({ onPress, testID, accessibilityLabel, icon, theme, color }: IBaseButton) => (
	<BorderlessButton
		onPress={onPress}
		style={styles.actionButton}
		testID={testID}
		// @ts-ignore
		accessibilityLabel={I18n.t(accessibilityLabel)}
		accessibilityTraits='button'>
		<CustomIcon name={icon} size={24} color={color ?? themes[theme!].auxiliaryTintColor} />
	</BorderlessButton>
));

export default BaseButton;
