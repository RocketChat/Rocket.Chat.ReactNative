import React from 'react';
import { View, Text } from 'react-native';
import { withNavigation } from 'react-navigation';
import PropTypes from 'prop-types';

import Avatar from '../../../containers/Avatar';
import Status from '../../../containers/Status';
import DisclosureIndicator from '../../../containers/DisclosureIndicator';
import Touch from '../../../utils/touch';
import RoomTypeIcon from '../../../containers/RoomTypeIcon';

import { COLOR_WHITE } from '../../../constants/colors';
import styles from './styles';
import sharedStyles from '../../Styles';

const RoomItem = ({
	name, baseUrl, user, member, route, params, testID, navigation
}) => {
	const { room } = params;

	const navigate = () => {
		navigation.navigate(route, params);
	};

	return (
		<Touch
			onPress={navigate}
			underlayColor={COLOR_WHITE}
			activeOpacity={0.5}
			accessibilityLabel={name}
			accessibilityTraits='button'
			testID={testID}
		>
			<View style={styles.sectionItem}>
				<Avatar
					key='avatar'
					text={room.name}
					size={50}
					style={styles.avatar}
					type={room.t}
					baseUrl={baseUrl}
					userId={user.id}
					token={user.token}
				>
					{room.t === 'd' && member._id ? <Status style={sharedStyles.status} id={member._id} /> : null }
				</Avatar>
				<View key='name' style={styles.roomTitleContainer}>
					{room.t === 'd'
						? <Text style={styles.roomTitle}>{room.fname}</Text>
						: (
							<View style={styles.roomTitleRow}>
								<RoomTypeIcon type={room.prid ? 'discussion' : room.t} />
								<Text style={styles.roomTitle}>{room.prid ? room.fname : room.name}</Text>
							</View>
						)
					}
					<Text style={styles.roomDescription} ellipsizeMode='tail' numberOfLines={1}>{room.t === 'd' ? `@${ name }` : room.topic}</Text>
				</View>
				<DisclosureIndicator key='disclosure-indicator' />
			</View>
		</Touch>
	);
};

RoomItem.propTypes = {
	name: PropTypes.string.isRequired,
	baseUrl: PropTypes.string.isRequired,
	route: PropTypes.string.isRequired,
	params: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired,
	user: PropTypes.shape({
		id: PropTypes.string,
		token: PropTypes.string
	}).isRequired,
	member: PropTypes.shape({
		_id: PropTypes.string
	}).isRequired,
	navigation: PropTypes.shape({
		navigate: PropTypes.func
	}).isRequired
};

export default withNavigation(RoomItem);
