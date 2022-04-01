import { BorderlessButton } from 'react-native-gesture-handler';
import React from 'react';

import styles from '../styles';
import i18n from '../../../i18n';
import { CustomIcon, TIconsName } from '../../CustomIcon';
import { useTheme } from '../../../theme';
import { themes } from '../../../constants/colors';

interface IBaseButton {
	onPress(): void;
	testID: string;
	accessibilityLabel: string;
	icon: TIconsName;
	color?: string;
}

const BaseButton = ({ accessibilityLabel, icon, color, ...props }: IBaseButton) => {
	const { theme } = useTheme();
	return (
		<BorderlessButton
			{...props}
			style={styles.actionButton}
			// @ts-ignore
			accessibilityLabel={i18n.t(accessibilityLabel)}
			accessibilityTraits='button'>
			<CustomIcon name={icon} size={24} color={color || themes[theme].auxiliaryTintColor} />
		</BorderlessButton>
	);
};

export default BaseButton;
