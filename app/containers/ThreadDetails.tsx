import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from './CustomIcon';
import { themes } from '../lib/constants';
import sharedStyles from '../views/Styles';
import { useTheme } from '../theme';
import { TThreadModel } from '../definitions/IThread';

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
	item: Pick<TThreadModel, 'tcount' | 'replies' | 'id'>;
	user: {
		id: string;
	};
	badgeColor?: string;
	toggleFollowThread: Function;
	style: ViewStyle;
}

const ThreadDetails = ({ item, user, badgeColor, toggleFollowThread, style }: IThreadDetails): JSX.Element => {
	const { theme } = useTheme();
	let count: string | number | undefined | null = item.tcount;
	if (count && count >= 1000) {
		count = '+999';
	}

	let replies: number | string = item?.replies?.length ?? 0;
	if (replies >= 1000) {
		replies = '+999';
	}

	const isFollowing = item.replies?.find((u: string) => u === user?.id);

	return (
		<View style={[styles.container, style]}>
			<View style={styles.detailsContainer}>
				<View style={styles.detailContainer}>
					<CustomIcon name='threads' size={24} />
					<Text
						testID={`thread-count-${count}`}
						style={[styles.detailText, { color: themes[theme].fontSecondaryInfo }]}
						numberOfLines={1}
					>
						{count}
					</Text>
				</View>

				<View style={styles.detailContainer}>
					<CustomIcon name='user' size={24} />
					<Text style={[styles.detailText, { color: themes[theme].fontSecondaryInfo }]} numberOfLines={1}>
						{replies}
					</Text>
				</View>
			</View>
			<View style={styles.badgeContainer}>
				{badgeColor ? <View style={[styles.badge, { backgroundColor: badgeColor }]} /> : null}
				<Touchable onPress={() => toggleFollowThread?.(isFollowing, item.id)}>
					<CustomIcon size={24} name={isFollowing ? 'notification' : 'notification-disabled'} />
				</Touchable>
			</View>
		</View>
	);
};

export default ThreadDetails;
