import { BorderlessButton } from 'react-native-gesture-handler';
import React from 'react';
import { View } from 'react-native';

import styles from '../styles';
import { CustomIcon } from '../../../lib/Icons';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import { testProps } from '../../../lib/methods/testProps';
import i18n from '../../../i18n';

interface IBaseButton {
	onPress(): void;
	testID: string;
	accessibilityLabel: string;
	icon: string;
	color: string;
}

const BaseButton = ({ accessibilityLabel, icon, color, ...props }: Partial<IBaseButton>) => {
	const { theme } = useTheme();
	return (
		<BorderlessButton {...props} style={styles.actionButton} {...testProps(props.testID)}>
			<View
				accessible
				accessibilityLabel={accessibilityLabel ? i18n.t(accessibilityLabel) : accessibilityLabel}
				accessibilityRole='button'>
				<CustomIcon name={icon} size={24} color={color || themes[theme].auxiliaryTintColor} />
			</View>
		</BorderlessButton>
	);
};

export default BaseButton;
