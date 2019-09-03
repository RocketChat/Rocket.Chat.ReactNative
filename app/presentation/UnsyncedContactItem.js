import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import Avatar from '../containers/Avatar';
import Touch from '../utils/touch';
import sharedStyles from '../views/Styles';
import { COLOR_WHITE } from '../constants/colors';

const styles = StyleSheet.create({
	button: {
		height: 20,
		position: 'absolute',
		right: 28,
		justifyContent: 'center',
		paddingHorizontal: 22,
		borderWidth: 0.5,
		borderColor: '#1d74f5',
		borderRadius: 3
	},
	inviteText: {
		fontSize: 12,
		color: '#1d74f5'
	},
	container: {
		height: 70,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLOR_WHITE
	},
	avatar: {
		marginHorizontal: 17
	},
	name: {
		fontSize: 17,
		marginHorizontal: 13,
		...sharedStyles.textMedium,
		...sharedStyles.textColorNormal
	}
});

const UnsyncedContactItem = ({
	name, onPress, testID, onLongPress, style, baseUrl, user
}) => (
	<View style={[styles.container, style]}>
		<Avatar text={name} size={48} type='d' style={styles.avatar} baseUrl={baseUrl} userId={user.id} token={user.token} />
		<Text style={styles.name}>{name}</Text>
		<Touch onPress={onPress} onLongPress={onLongPress} style={styles.button} testID={testID}>
			<Text style={styles.inviteText}>Invite</Text>
		</Touch>
	</View>
);

UnsyncedContactItem.propTypes = {
	name: PropTypes.string.isRequired,
	user: PropTypes.shape({
		id: PropTypes.string,
		token: PropTypes.string
	}),
	baseUrl: PropTypes.string.isRequired,
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired,
	onLongPress: PropTypes.func,
	style: PropTypes.any
};

export default UnsyncedContactItem;
