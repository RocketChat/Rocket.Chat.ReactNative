import React from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CustomIcon } from '../CustomIcon';
import sharedStyles from '../../views/Styles';
import Avatar from '../Avatar';

const styles = StyleSheet.create(theme => ({
	pressable: {
		paddingHorizontal: 8,
		marginRight: 8,
		borderRadius: 4,
		justifyContent: 'center',
		maxWidth: 192,
		variants: {
			pressed: {
				true: {
					backgroundColor: theme.surfaceNeutral
				},
				false: {
					backgroundColor: theme.surfaceHover
				}
			}
		}
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
		color: theme.fontDefault,
		...sharedStyles.textMedium
	},
	ripple: {
		color: theme.surfaceNeutral
	}
}));

export interface IChip {
	avatar?: string;
	text: string;
	onPress?: Function;
	testID?: string;
	style?: StyleProp<ViewStyle>;
}

const Chip = ({ avatar, text, onPress, testID, style }: IChip) => {
	return (
		<Pressable
			testID={testID}
			style={({ pressed }) => {
				styles.useVariants({ pressed });

				return [styles.pressable, style];
			}}
			disabled={!onPress}
			onPress={() => onPress?.()}
			android_ripple={styles.ripple}>
			<View style={styles.container}>
				{avatar ? <Avatar text={avatar} size={28} style={styles.avatar} /> : null}
				<View style={styles.textContainer}>
					<Text style={styles.name} numberOfLines={1}>
						{text}
					</Text>
				</View>
				{onPress ? <CustomIcon name='close' size={16} /> : null}
			</View>
		</Pressable>
	);
};

export default Chip;
