import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';

import Avatar from '../../../containers/Avatar';
import Status from '../../../containers/Status';
import DisclosureIndicator from '../../../containers/DisclosureIndicator';
import Touch from '../../../utils/touch';
import RoomTypeIcon from '../../../containers/RoomTypeIcon';

import { COLOR_WHITE } from '../../../constants/colors';
import styles from './styles';
import sharedStyles from '../../Styles';

const Header = memo(({
	name, baseUrl, room, user, member, onPress, testID
}) => (
	<Touch
		onPress={onPress}
		underlayColor={COLOR_WHITE}
		activeOpacity={0.5}
		accessibilityLabel={name}
		accessibilityTraits='button'
		testID={testID}
	>
		<View style={styles.sectionItem}>
			<Avatar
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
), isEqual);

Header.propTypes = {
	name: PropTypes.string.isRequired,
	baseUrl: PropTypes.string.isRequired,
	room: PropTypes.shape({
		name: PropTypes.string,
		fname: PropTypes.string,
		t: PropTypes.string,
		prid: PropTypes.string,
		topic: PropTypes.string
	}),
	user: PropTypes.shape({
		id: PropTypes.string,
		token: PropTypes.string
	}).isRequired,
	member: PropTypes.shape({
		_id: PropTypes.string
	}).isRequired,
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};

export default Header;
