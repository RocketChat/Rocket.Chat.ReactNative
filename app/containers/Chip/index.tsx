import React from 'react';
import { Pressable, StyleSheet, View, Text, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import sharedStyles from '../../views/Styles';
import Avatar from '../Avatar';

const styles = StyleSheet.create({
	pressable: {
		paddingHorizontal: 8,
		marginRight: 8,
		borderRadius: 4,
		justifyContent: 'center',
		maxWidth: 192
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatar: {
		marginRight: 8,
		marginVertical: 8
	},
	textContainer: {
		marginRight: 8,
		maxWidth: 120
	},
	name: {
		fontSize: 16,
		...sharedStyles.textMedium
	}
});

export interface IChip {
	avatar?: string;
	text: string;
	onPress?: Function;
	testID?: string;
	style?: StyleProp<ViewStyle>;
}

const Chip = ({ avatar, text, onPress, testID, style }: IChip) => {
	const { colors } = useTheme();

	return (
		<Pressable
			testID={testID}
			style={({ pressed }) => [
				styles.pressable,
				{
					backgroundColor: pressed ? colors.surfaceNeutral : colors.surfaceHover
				},
				style
			]}
			disabled={!onPress}
			onPress={() => onPress?.()}
			android_ripple={{
				color: colors.surfaceNeutral
			}}
		>
			<View style={styles.container}>
				{avatar ? <Avatar text={avatar} size={28} style={styles.avatar} /> : null}
				<View style={styles.textContainer}>
					<Text style={[styles.name, { color: colors.fontDefault }]} numberOfLines={1}>
						{text}
					</Text>
				</View>
				{onPress ? <CustomIcon name='close' size={16} /> : null}
			</View>
		</Pressable>
	);
};

export default Chip;
