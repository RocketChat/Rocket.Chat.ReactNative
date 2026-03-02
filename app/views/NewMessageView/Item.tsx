import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderlessButton, RectButton } from 'react-native-gesture-handler';

import Avatar from '../../containers/Avatar';
import { CustomIcon } from '../../containers/CustomIcon';
import sharedStyles from '../Styles';
import { useTheme } from '../../theme';
import { mediaSessionInstance } from '../../lib/services/voip/MediaSessionInstance';
import type { TSubscriptionModel } from '../../definitions';

const styles = StyleSheet.create({
	button: {
		height: 54
	},
	container: {
		flexDirection: 'row'
	},
	avatar: {
		marginHorizontal: 12,
		marginVertical: 12
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		marginRight: 12
	},
	name: {
		fontSize: 18,
		lineHeight: 26,
		...sharedStyles.textMedium
	},
	iconContainer: {
		paddingHorizontal: 15,
		alignSelf: 'center'
	}
});

interface IItem {
	room: TSubscriptionModel;
	name: string;
	username: string;
	onPress(): void;
	testID: string;
	onLongPress?: () => void;
}

const Item = ({ room, name, username, onPress, testID, onLongPress }: IItem) => {
	const { colors } = useTheme();

	const handleCallPress = () => {
		if (!room) return;
		mediaSessionInstance.startCallByRoom(room);
	};

	return (
		<RectButton
			onPress={onPress}
			onLongPress={onLongPress}
			testID={testID}
			underlayColor={colors.surfaceNeutral}
			rippleColor={colors.surfaceNeutral}
			style={{ backgroundColor: colors.surfaceLight }}
			accessibilityLabel={name}
			accessibilityRole='button'>
			<View style={[styles.container, styles.button]}>
				<Avatar text={username} size={30} style={styles.avatar} />
				<View style={styles.textContainer}>
					<Text style={[styles.name, { color: colors.fontDefault }]} numberOfLines={1}>
						{name}
					</Text>
				</View>
				<BorderlessButton onPress={handleCallPress} testID={`${testID}-call`} style={styles.iconContainer}>
					<CustomIcon name={'phone'} size={22} color={colors.fontDefault} />
				</BorderlessButton>
			</View>
		</RectButton>
	);
};

export default Item;
