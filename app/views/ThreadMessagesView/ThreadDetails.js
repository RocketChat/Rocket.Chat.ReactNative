import React from 'react';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';
import { View, Text, StyleSheet } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';
import { formatDateThreads } from '../../utils/room';
import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	detailsContainer: {
		flexDirection: 'row',
		justifyContent: 'center'
	},
	detailContainer: {
		marginRight: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
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

const ThreadDetails = React.memo(({
	item,
	user,
	badgeColor,
	toggleFollowThread,
	style,
	theme
}) => {
	let tlm;
	if (item?.tlm) {
		tlm = formatDateThreads(item.tlm);
	}

	const isFollowing = item.replies?.find(u => u === user.id);

	return (
		<View style={[styles.container, style]}>
			<View style={styles.detailsContainer}>
				<View style={styles.detailContainer}>
					<CustomIcon name='threads' size={20} color={themes[theme].auxiliaryText} />
					<Text style={[styles.detailText, { color: themes[theme].auxiliaryText }]}>{item?.tcount}</Text>
				</View>

				<View style={styles.detailContainer}>
					<CustomIcon name='user' size={20} color={themes[theme].auxiliaryText} />
					<Text style={[styles.detailText, { color: themes[theme].auxiliaryText }]}>{item?.replies?.length}</Text>
				</View>

				<View style={styles.detailContainer}>
					<CustomIcon name='clock' size={20} color={themes[theme].auxiliaryText} />
					<Text style={[styles.detailText, { color: themes[theme].auxiliaryText }]}>{tlm}</Text>
				</View>
			</View>

			<Touchable style={styles.badgeContainer} onPress={() => toggleFollowThread?.(isFollowing, item.id)}>
				<>
					{badgeColor ? <View style={[styles.badge, { backgroundColor: badgeColor }]} /> : null }
					<CustomIcon
						size={24}
						name={isFollowing ? 'notification' : 'notification-disabled'}
						color={themes[theme].auxiliaryTintColor}
					/>
				</>
			</Touchable>
		</View>
	);
}, (prevProps, nextProps) => {
	if (!isEqual(prevProps.item, nextProps.item)) {
		return false;
	}
	if (!isEqual(prevProps.user, nextProps.user)) {
		return false;
	}
	if (prevProps.badgeColor !== nextProps.badgeColor) {
		return false;
	}
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
	return true;
});
ThreadDetails.propTypes = {
	item: PropTypes.object,
	user: PropTypes.object,
	badgeColor: PropTypes.string,
	toggleFollowThread: PropTypes.func,
	style: PropTypes.object,
	theme: PropTypes.string
};

export default ThreadDetails;
