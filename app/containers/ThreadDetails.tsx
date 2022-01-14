import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../lib/Icons';
import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';
import { useTheme } from '../theme';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	detailsContainer: {
		flex: 1,
		flexDirection: 'row'
	},
	detailContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 8
	},
	detailText: {
		fontSize: 10,
		marginLeft: 2,
		...sharedStyles.textSemibold
	},
	badgeContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	badge: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 8
	}
});

interface IThreadDetails {
	item: {
		tcount: number | string;
		replies?: any;
		id: string;
	};
	user: {
		id: string;
	};
	badgeColor: string;
	toggleFollowThread: Function;
	thread: boolean;
	time: string;
	style: ViewStyle;
}

const ThreadDetails = ({ item, user, badgeColor, toggleFollowThread, style }: IThreadDetails) => {
	const { theme } = useTheme();
	let { tcount } = item;

	if (tcount >= 1000) {
		tcount = '+999';
	}

	let replies = item?.replies?.length ?? 0;
	if (replies >= 1000) {
		replies = '+999';
	}

	const isFollowing = item.replies?.find((u: any) => u === user?.id);

	return (
		<View style={[styles.container, style]}>
			<View style={styles.detailsContainer}>
				<View style={styles.detailContainer}>
					<CustomIcon name={'threads'} size={24} color={themes[theme!].auxiliaryText} />
					<Text style={[styles.detailText, { color: themes[theme!].auxiliaryText }]} numberOfLines={1}>
						{tcount}
					</Text>
				</View>

				<View style={styles.detailContainer}>
					<CustomIcon name={'user'} size={24} color={themes[theme!].auxiliaryText} />
					<Text style={[styles.detailText, { color: themes[theme!].auxiliaryText }]} numberOfLines={1}>
						{replies}
					</Text>
				</View>
			</View>
			<View style={styles.badgeContainer}>
				{badgeColor ? <View style={[styles.badge, { backgroundColor: badgeColor }]} /> : null}
				<Touchable onPress={() => toggleFollowThread?.(isFollowing, item.id)}>
					<CustomIcon
						size={24}
						name={isFollowing ? 'notification' : 'notification-disabled'}
						color={themes[theme!].auxiliaryTintColor}
					/>
				</Touchable>
			</View>
		</View>
	);
};

export default ThreadDetails;
