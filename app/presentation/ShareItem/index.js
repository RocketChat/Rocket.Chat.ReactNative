import React from 'react';
import PropTypes from 'prop-types';
import { Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import Avatar from '../../containers/Avatar';
import styles from './styles';
import DisclosureIndicator from '../../containers/DisclosureIndicator';

export const ROW_HEIGHT = 56;

const ShareItem = React.memo(({
	baseUrl, userId, token, name, type, onPress
}) => (
	<RectButton onPress={onPress}>
		<View style={styles.content}>
			<Avatar text={name} size={24} type={type} baseUrl={baseUrl} style={styles.avatar} userId={userId} token={token} borderRadius={2} />
			<View style={styles.center}>
				<Text style={styles.name} ellipsizeMode='tail' numberOfLines={1}>{name}</Text>
				<DisclosureIndicator />
			</View>
		</View>
	</RectButton>
));

ShareItem.propTypes = {
	type: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	token: PropTypes.string,
	userId: PropTypes.string,
	baseUrl: PropTypes.string,
	onPress: PropTypes.func
};

export default ShareItem;
