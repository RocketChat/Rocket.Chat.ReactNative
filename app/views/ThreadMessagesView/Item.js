import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';

import { withTheme } from '../../theme';
import Avatar from '../../containers/Avatar';
import Touch from '../../utils/touch';
import sharedStyles from '../Styles';
import { themes } from '../../constants/colors';
import Markdown from '../../containers/markdown';
import { CustomIcon } from '../../lib/Icons';
import { formatDateThreads, makeThreadName } from '../../utils/room';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		padding: 16
	},
	contentContainer: {
		flexDirection: 'column',
		flex: 1
	},
	titleContainer: {
		flexDirection: 'row',
		marginBottom: 2,
		alignItems: 'center'
	},
	title: {
		flexShrink: 1,
		fontSize: 18,
		...sharedStyles.textMedium
	},
	time: {
		fontSize: 14,
		marginLeft: 4,
		...sharedStyles.textRegular
	},
	avatar: {
		marginRight: 8
	},
	detailsContainer: {
		marginTop: 8,
		flexDirection: 'row'
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
		marginLeft: 8,
		justifyContent: 'center'
	},
	badge: {
		width: 12,
		height: 12,
		borderRadius: 6
	}
});

const Item = ({
	item, baseUrl, theme, useRealName, user, badgeColor, onPress
}) => {
	const username = (useRealName && item?.u?.name) || item?.u?.username;
	let time;
	if (item?.ts) {
		time = formatDateThreads(item.ts);
	}

	let tlm;
	if (item?.tlm) {
		tlm = formatDateThreads(item.tlm);
	}

	return (
		<Touch theme={theme} onPress={() => onPress(item)} testID={`thread-messages-view-${ item.msg }`} style={{ backgroundColor: themes[theme].backgroundColor }}>
			<View style={styles.container}>
				<Avatar
					style={styles.avatar}
					text={item?.u?.username}
					size={36}
					borderRadius={4}
					baseUrl={baseUrl}
					userId={user?.id}
					token={user?.token}
					theme={theme}
				/>
				<View style={styles.contentContainer}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: themes[theme].titleText }]} numberOfLines={1}>{username}</Text>
						<Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
					</View>
					<Markdown msg={makeThreadName(item)} baseUrl={baseUrl} username={username} theme={theme} numberOfLines={2} preview />
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
				</View>
				{badgeColor
					? (
						<View style={styles.badgeContainer}>
							<View style={[styles.badge, { backgroundColor: badgeColor }]} />
						</View>
					)
					: null}
			</View>
		</Touch>
	);
};

Item.propTypes = {
	item: PropTypes.object,
	baseUrl: PropTypes.string,
	theme: PropTypes.string,
	useRealName: PropTypes.bool,
	user: PropTypes.object,
	badgeColor: PropTypes.string,
	onPress: PropTypes.func
};

export default withTheme(Item);
