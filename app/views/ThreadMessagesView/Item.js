import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import moment from 'moment';

import { withTheme } from '../../theme';
import Avatar from '../../containers/Avatar';
import Touch from '../../utils/touch';
import sharedStyles from '../Styles';
import { themes } from '../../constants/colors';
import Markdown from '../../containers/markdown';
import { CustomIcon } from '../../lib/Icons';

const styles = StyleSheet.create({
	titleContainer: {
		flexDirection: 'row',
		marginBottom: 2,
		alignItems: 'center'
	},
	title: {
		// flexGrow: 1,
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
		...sharedStyles.textMedium
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
})

const Item = ({
	item, baseUrl, theme, useRealName, user
}) => {
	const username = (useRealName && item?.u?.name) || item?.u?.username;
	let time;
	if (item?.ts) {
		time = moment(item.ts).format('MMM D');
	}

	return (
		<Touch theme={theme}>
			<View style={{ flexDirection: 'row', padding: 16 }}>
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
				<View style={{ flexDirection: 'column', flex: 1 }}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: themes[theme].titleText }]} numberOfLines={1}>{username}</Text>
						<Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
					</View>
					<Markdown msg={item?.msg} baseUrl={baseUrl} username={username} getCustomEmoji={() => {}} theme={theme} numberOfLines={2} preview />
					<View style={styles.detailsContainer}>
						<View style={styles.detailContainer}>
							<CustomIcon name='threads' size={20} color={themes[theme].auxiliaryText} />
							<Text style={[styles.detailText, { color: themes[theme].auxiliaryText }]}>123</Text>
						</View>

						<View style={styles.detailContainer}>
							<CustomIcon name='user' size={20} color={themes[theme].auxiliaryText} />
							<Text style={[styles.detailText, { color: themes[theme].auxiliaryText }]}>123</Text>
						</View>

						<View style={styles.detailContainer}>
							<CustomIcon name='clock' size={20} color={themes[theme].auxiliaryText} />
							<Text style={[styles.detailText, { color: themes[theme].auxiliaryText }]}>123</Text>
						</View>
					</View>
				</View>
				<View style={styles.badgeContainer}>
					<View style={[styles.badge, { backgroundColor: 'red' }]} />
				</View>
			</View>
		</Touch>
	);
};

export default withTheme(Item);
