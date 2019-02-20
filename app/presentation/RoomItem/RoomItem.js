import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import Avatar from '../../containers/Avatar';
import I18n from '../../i18n';
import styles from './styles';
import MentionsCount from './MentionsCount';
import LastMessage from './LastMessage';
import DisclosureIndicator from './DisclosureIndicator';
import Type from './Type';
import UpdatedAt from './UpdatedAt';

const formatDate = date => moment(date).calendar(null, {
	lastDay: `[${ I18n.t('Yesterday') }]`,
	sameDay: 'h:mm A',
	lastWeek: 'dddd',
	sameElse: 'MMM D'
});

const RoomItem = ({
	item, testID, height, onPress, showLastMessage, avatarSize, baseUrl, user
}) => {
	const date = formatDate(item.roomUpdatedAt);

	let accessibilityLabel = item.name;
	if (item.unread === 1) {
		accessibilityLabel += `, ${ item.unread } ${ I18n.t('alert') }`;
	} else if (item.unread > 1) {
		accessibilityLabel += `, ${ item.unread } ${ I18n.t('alerts') }`;
	}

	if (item.userMentions > 0) {
		accessibilityLabel += `, ${ I18n.t('you_were_mentioned') }`;
	}

	if (date) {
		accessibilityLabel += `, ${ I18n.t('last_message') } ${ date }`;
	}

	return (
		<RectButton
			onPress={onPress}
			activeOpacity={0.8}
			underlayColor='#e1e5e8'
			testID={testID}
		>
			<View
				style={[styles.container, item.favorite && styles.favorite, height && { height }]}
				accessibilityLabel={accessibilityLabel}
			>
				<Avatar
					text={item.name}
					size={avatarSize}
					type={item.t}
					baseUrl={baseUrl}
					style={{ marginHorizontal: 15 }}
					user={user}
				/>
				<View style={styles.centerContainer}>
					<View style={styles.titleContainer}>
						<Type rid={item.rid} t={item.t} userId={user.id} />
						<Text style={[styles.title, alert && styles.alert]} ellipsizeMode='tail' numberOfLines={1}>{ item.name }</Text>
						<UpdatedAt date={date} />
					</View>
					<View style={styles.row}>
						<LastMessage showLastMessage={showLastMessage} />
						<MentionsCount unread={item.unread} userMentions={item.userMentions} />
					</View>
				</View>
				<DisclosureIndicator />
			</View>
		</RectButton>
	);
};

RoomItem.propTypes = {
	baseUrl: PropTypes.string.isRequired,
	showLastMessage: PropTypes.bool,
	onPress: PropTypes.func,
	user: PropTypes.shape({
		id: PropTypes.string,
		username: PropTypes.string,
		token: PropTypes.string
	}),
	item: PropTypes.object,
	avatarSize: PropTypes.number,
	testID: PropTypes.string,
	height: PropTypes.number
};

RoomItem.defaultProps = {
	showLastMessage: true,
	avatarSize: 48
};

export default RoomItem;
