import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon, TIconsName } from '../../containers/CustomIcon';

interface ITipProps {
	type?: 'success' | 'error';
	description: string;
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row'
	}
});

const Tip = ({ type, description }: ITipProps) => {
	const { colors } = useTheme();

	let icon: TIconsName = 'info';
	let color = colors.fontDefault;
	if (type === 'success') {
		icon = 'success-circle';
		color = colors.statusFontSuccess;
	}
	if (type === 'error') {
		icon = 'error-circle';
		color = colors.statusFontDanger;
	}
	return (
		<View accessibilityLabel={description} style={styles.container}>
			<CustomIcon color={color} name={icon} size={16} style={{ marginRight: 4 }} />
			<Text>{description}</Text>
		</View>
	);
};

export default Tip;
