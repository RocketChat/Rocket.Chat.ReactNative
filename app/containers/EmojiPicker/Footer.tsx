import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import styles from './styles';
import { IFooterProps } from './interfaces';

const BUTTON_HIT_SLOP = { top: 15, right: 15, bottom: 15, left: 15 };

const Footer = React.memo(({ onSearchPressed, onBackspacePressed }: IFooterProps) => {
	const { colors } = useTheme();
	return (
		<View style={[styles.footerContainer, { backgroundColor: colors.bannerBackground }]}>
			<BorderlessButton activeOpacity={0.7} onPress={onSearchPressed} style={styles.footerButtonsContainer}>
				<CustomIcon color={colors.auxiliaryTintColor} size={25} name='search' />
			</BorderlessButton>

			<TouchableOpacity activeOpacity={0.7} onPress={onBackspacePressed} hitSlop={BUTTON_HIT_SLOP}>
				<CustomIcon color={colors.auxiliaryTintColor} size={25} name='backspace' />
			</TouchableOpacity>
		</View>
	);
});

export default Footer;
