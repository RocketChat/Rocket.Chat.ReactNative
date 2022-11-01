import React from 'react';
import { View, Pressable } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import styles from './styles';
import { IFooterProps } from './interfaces';

const BUTTON_HIT_SLOP = { top: 15, right: 15, bottom: 15, left: 15 };

const Footer = ({ onSearchPressed, onBackspacePressed }: IFooterProps): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<View style={[styles.footerContainer, { borderTopColor: colors.borderColor }]}>
			<Pressable
				onPress={onSearchPressed}
				hitSlop={BUTTON_HIT_SLOP}
				style={({ pressed }) => [styles.footerButtonsContainer, { opacity: pressed ? 0.7 : 1 }]}
				testID='emoji-picker-search'
			>
				<CustomIcon color={colors.auxiliaryTintColor} size={24} name='search' />
			</Pressable>

			<Pressable
				onPress={onBackspacePressed}
				hitSlop={BUTTON_HIT_SLOP}
				style={({ pressed }) => [styles.footerButtonsContainer, { opacity: pressed ? 0.7 : 1 }]}
				testID='emoji-picker-backspace'
			>
				<CustomIcon color={colors.auxiliaryTintColor} size={24} name='backspace' />
			</Pressable>
		</View>
	);
};

export default Footer;
