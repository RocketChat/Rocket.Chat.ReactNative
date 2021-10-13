import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../lib/Icons';
import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';
import { withTheme } from '../theme';

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
		tcount?: number | string;
		dcount?: number | string;
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
	style: object;
	theme: string;
}

const ThreadDetails = ({ item, user, badgeColor, toggleFollowThread, thread, time, style, theme }: IThreadDetails) => {
	const { tcount, dcount } = item;
	let count = tcount || dcount;

	if (count! >= 1000) {
		count = '+999';
	} else if (count! >= 100) {
		count = '+99';
	}

	let replies = item?.replies?.length ?? 0;
	if (replies >= 1000) {
		replies = '+999';
	} else if (replies >= 100) {
		replies = '+99';
	}

	const isFollowing = item.replies?.find((u: any) => u === user?.id);

	return (
		<View style={[styles.container, style]}>
			<View style={styles.detailsContainer}>
				<View style={styles.detailContainer}>
					<CustomIcon name={thread ? 'threads' : 'discussions'} size={24} color={themes[theme].auxiliaryText} />
					<Text style={[styles.detailText, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>
						{count}
					</Text>
				</View>

				<View style={styles.detailContainer}>
					<CustomIcon name={thread ? 'user' : 'clock'} size={24} color={themes[theme].auxiliaryText} />
					<Text style={[styles.detailText, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>
						{thread ? replies : time}
					</Text>
				</View>
			</View>

			{thread ? (
				<View style={styles.badgeContainer}>
					{badgeColor ? <View style={[styles.badge, { backgroundColor: badgeColor }]} /> : null}
					<Touchable onPress={() => toggleFollowThread?.(isFollowing, item.id)}>
						<CustomIcon
							size={24}
							name={isFollowing ? 'notification' : 'notification-disabled'}
							color={themes[theme].auxiliaryTintColor}
						/>
					</Touchable>
				</View>
			) : null}
		</View>
	);
};

export default withTheme(ThreadDetails);
