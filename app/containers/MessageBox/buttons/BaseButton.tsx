import { BorderlessButton } from 'react-native-gesture-handler';
import React from 'react';

import styles from '../styles';
import { CustomIcon } from '../../../lib/Icons';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import { testProps } from '../../../lib/methods/testProps';

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
			// @ts-ignore
			accessibilityTraits='button'
			{...testProps(props.testID)}>
			<CustomIcon name={icon} size={24} color={color || themes[theme].auxiliaryTintColor} />
		</BorderlessButton>
	);
};

export default BaseButton;
