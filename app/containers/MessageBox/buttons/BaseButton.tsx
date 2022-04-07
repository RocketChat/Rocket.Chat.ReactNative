import { BorderlessButton } from 'react-native-gesture-handler';
import React from 'react';

import styles from '../styles';
import i18n from '../../../i18n';
import { CustomIcon } from '../../../lib/Icons';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';

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
		<BorderlessButton
			{...props}
			style={styles.actionButton}
			// TODO: Review this accessibility params because they didn't exist in BorderlessButton
			// https://docs.swmansion.com/react-native-gesture-handler/docs/1.10.3/api/components/buttons The first important session
			// @ts-ignore
			accessibilityLabel={i18n.t(accessibilityLabel)}
			accessibilityTraits='button'>
			<CustomIcon name={icon} size={24} color={color || themes[theme].auxiliaryTintColor} />
		</BorderlessButton>
	);
};

export default BaseButton;
