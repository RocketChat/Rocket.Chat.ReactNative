import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import styles from './styles';
import { IFooterProps } from './interfaces';

const Footer = React.memo(({ onBackspacePressed }: IFooterProps) => {
	const { colors } = useTheme();
	return (
		<View style={[styles.footerContainer, { backgroundColor: colors.bannerBackground }]}>
			<BorderlessButton activeOpacity={0.7} onPress={() => console.log('Search!')} style={styles.footerButtonsContainer}>
				<CustomIcon color={colors.auxiliaryTintColor} size={24} name='search' />
			</BorderlessButton>

			<TouchableOpacity activeOpacity={0.7} onPress={onBackspacePressed}>
				<CustomIcon color={colors.auxiliaryTintColor} size={24} name='backspace' />
			</TouchableOpacity>
		</View>
	);
});

export default Footer;
