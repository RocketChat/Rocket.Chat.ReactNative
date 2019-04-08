import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, ScrollView
} from 'react-native';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { isIOS } from '../../../utils/deviceInfo';
import Icon from './Icon';
import { COLOR_TEXT_DESCRIPTION, HEADER_TITLE, COLOR_WHITE } from '../../../constants/colors';

const TITLE_SIZE = 16;
const styles = StyleSheet.create({
	container: {
		flex: 1,
		height: '100%'
	},
	titleContainer: {
		flex: 6,
		flexDirection: 'row'
	},
	title: {
		...sharedStyles.textSemibold,
		color: HEADER_TITLE,
		fontSize: TITLE_SIZE
	},
	scroll: {
		alignItems: 'center'
	},
	typing: {
		...sharedStyles.textRegular,
		color: isIOS ? COLOR_TEXT_DESCRIPTION : COLOR_WHITE,
		fontSize: 12,
		flex: 4
	},
	typingUsers: {
		...sharedStyles.textSemibold
	}
});

const Typing = React.memo(({ usersTyping }) => {
	const users = usersTyping.map(item => item.username);
	let usersText;
	if (!users.length) {
		return null;
	} else if (users.length === 2) {
		usersText = users.join(` ${ I18n.t('and') } `);
	} else {
		usersText = users.join(', ');
	}
	return (
		<Text style={styles.typing} numberOfLines={1}>
			<Text style={styles.typingUsers}>{usersText} </Text>
			{ users.length > 1 ? I18n.t('are_typing') : I18n.t('is_typing') }...
		</Text>
	);
});

Typing.propTypes = {
	usersTyping: PropTypes.array
};

const Header = React.memo(({
	prid, title, type, status, usersTyping, width, height
}) => {
	const portrait = height > width;
	let scale = 1;

	if (!portrait) {
		if (usersTyping.length > 0) {
			scale = 0.8;
		}
	}
	return (
		<View style={styles.container}>
			<View style={styles.titleContainer}>
				<ScrollView
					showsHorizontalScrollIndicator={false}
					horizontal
					bounces={false}
					contentContainerStyle={styles.scroll}
				>
					<Icon type={prid ? 'discussion' : type} status={status} />
					<Text style={[styles.title, { fontSize: TITLE_SIZE * scale }]} numberOfLines={1}>{title}</Text>
				</ScrollView>
			</View>
			<Typing usersTyping={usersTyping} />
		</View>
	);
});

Header.propTypes = {
	title: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	prid: PropTypes.string,
	status: PropTypes.string,
	usersTyping: PropTypes.array
};

Header.defaultProps = {
	usersTyping: []
};

export default Header;
