/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
	let { tcount, dcount } = item;
	if (thread) {
		if (tcount! >= 1000) {
			tcount = '+999';
		} else if (tcount! >= 100) {
			tcount = '+99';
		}
	}

	if (dcount! >= 1000) {
		dcount = '+999';
	} else if (dcount! >= 100) {
		dcount = '+99';
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
						{thread ? tcount : dcount}
					</Text>
				</View>

				{thread ? (
					<View style={styles.detailContainer}>
						<CustomIcon name='user' size={24} color={themes[theme].auxiliaryText} />
						<Text style={[styles.detailText, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>
							{replies}
						</Text>
					</View>
				) : (
					<View style={styles.detailContainer}>
						<CustomIcon name='clock' size={24} color={themes[theme].auxiliaryText} />
						<Text style={[styles.detailText, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>
							{time}
						</Text>
					</View>
				)}
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
