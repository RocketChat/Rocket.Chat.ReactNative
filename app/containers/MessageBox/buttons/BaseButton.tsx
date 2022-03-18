import { BorderlessButton } from 'react-native-gesture-handler';
import React from 'react';

import I18n from '@app/i18n';
import { useColors } from '@app/lib/hooks/useColors';
import { CustomIcon } from '@app/lib/Icons';

import styles from '../styles';

interface IBaseButton {
	onPress(): void;
	testID: string;
	accessibilityLabel: string;
	icon: string;
	color: string;
}

const BaseButton = ({ accessibilityLabel, icon, color, ...props }: Partial<IBaseButton>) => {
	const { colors } = useColors();
	return (
		<BorderlessButton
			{...props}
			style={styles.actionButton}
			// @ts-ignore
			accessibilityLabel={I18n.t(accessibilityLabel)}
			accessibilityTraits='button'>
			<CustomIcon name={icon} size={24} color={color || colors.auxiliaryTintColor} />
		</BorderlessButton>
	);
};

export default BaseButton;
