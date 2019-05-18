import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, ScrollView
} from 'react-native';
import { emojify } from 'react-emojione';
import removeMarkdown from 'remove-markdown';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { isIOS, isAndroid } from '../../../utils/deviceInfo';
import Icon from './Icon';
import { COLOR_TEXT_DESCRIPTION, HEADER_TITLE, COLOR_WHITE } from '../../../constants/colors';

const TITLE_SIZE = 16;
const styles = StyleSheet.create({
	container: {
		height: '100%'
	},
	titleContainer: {
		flex: 6,
		flexDirection: 'row'
	},
	threadContainer: {
		marginRight: isAndroid ? 20 : undefined
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

const HeaderTitle = React.memo(({
	title, scale, connecting
}) => {
	if (connecting) {
		title = I18n.t('Connecting');
	}
	return (
		<Text
			style={[styles.title, { fontSize: TITLE_SIZE * scale }]}
			numberOfLines={1}
			testID={`room-view-title-${ title }`}
		>{title}
		</Text>
	);
});

HeaderTitle.propTypes = {
	title: PropTypes.string,
	scale: PropTypes.number,
	connecting: PropTypes.bool
};

const Header = React.memo(({
	title, type, status, usersTyping, width, height, prid, tmid, widthOffset, connecting
}) => {
	const portrait = height > width;
	let scale = 1;

	if (!portrait) {
		if (usersTyping.length > 0) {
			scale = 0.8;
		}
	}
	if (title) {
		title = emojify(title, { output: 'unicode' });
		if (tmid) {
			title = removeMarkdown(title);
		}
	}

	return (
		<View style={[styles.container, { width: width - widthOffset }]}>
			<View style={[styles.titleContainer, tmid && styles.threadContainer]}>
				<ScrollView
					showsHorizontalScrollIndicator={false}
					horizontal
					bounces={false}
					contentContainerStyle={styles.scroll}
				>
					<Icon type={prid ? 'discussion' : type} status={status} />
					<HeaderTitle
						prid={prid}
						type={type}
						status={status}
						title={title}
						scale={scale}
						connecting={connecting}
					/>
				</ScrollView>
			</View>
			{type === 'thread' ? null : <Typing usersTyping={usersTyping} />}
		</View>
	);
});

Header.propTypes = {
	title: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	prid: PropTypes.string,
	tmid: PropTypes.string,
	status: PropTypes.string,
	usersTyping: PropTypes.array,
	widthOffset: PropTypes.number,
	connecting: PropTypes.bool
};

Header.defaultProps = {
	usersTyping: []
};

export default Header;
