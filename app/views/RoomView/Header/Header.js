import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, TouchableOpacity
} from 'react-native';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { isAndroid, isTablet } from '../../../utils/deviceInfo';
import Icon from './Icon';
import { themes } from '../../../constants/colors';
import Markdown from '../../../containers/markdown';

const androidMarginLeft = isTablet ? 0 : 4;

const TITLE_SIZE = 16;
const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginRight: isAndroid ? 15 : 5,
		marginLeft: isAndroid ? androidMarginLeft : -10
	},
	titleContainer: {
		alignItems: 'center',
		flexDirection: 'row'
	},
	threadContainer: {
		marginRight: isAndroid ? 20 : undefined
	},
	title: {
		...sharedStyles.textSemibold,
		fontSize: TITLE_SIZE
	},
	scroll: {
		alignItems: 'center'
	},
	subtitle: {
		...sharedStyles.textRegular,
		fontSize: 12
	},
	typingUsers: {
		...sharedStyles.textSemibold
	}
});

const SubTitle = React.memo(({ usersTyping, subtitle, theme }) => {
	if (!subtitle && !usersTyping.length) {
		return null;
	}

	// typing
	if (usersTyping.length) {
		let usersText;
		if (usersTyping.length === 2) {
			usersText = usersTyping.join(` ${ I18n.t('and') } `);
		} else {
			usersText = usersTyping.join(', ');
		}
		return (
			<Text style={[styles.subtitle, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>
				<Text style={styles.typingUsers}>{usersText} </Text>
				{ usersTyping.length > 1 ? I18n.t('are_typing') : I18n.t('is_typing') }...
			</Text>
		);
	}

	// subtitle
	if (subtitle) {
		return (
			<Markdown
				preview
				msg={subtitle}
				style={[styles.subtitle, { color: themes[theme].auxiliaryText }]}
				numberOfLines={1}
				theme={theme}
			/>
		);
	}
});

SubTitle.propTypes = {
	usersTyping: PropTypes.array,
	theme: PropTypes.string,
	subtitle: PropTypes.string
};

const HeaderTitle = React.memo(({
	title, tmid, prid, scale, connecting, theme
}) => {
	if (connecting) {
		title = I18n.t('Connecting');
	}

	if (!tmid && !prid) {
		return (
			<Text
				style={[styles.title, { fontSize: TITLE_SIZE * scale, color: themes[theme].headerTitleColor }]}
				numberOfLines={1}
				testID={`room-view-title-${ title }`}
			>
				{title}
			</Text>
		);
	}

	return (
		<Markdown
			preview
			msg={title}
			style={[styles.title, { fontSize: TITLE_SIZE * scale, color: themes[theme].headerTitleColor }]}
			numberOfLines={1}
			theme={theme}
			testID={`room-view-title-${ title }`}
		/>
	);
});

HeaderTitle.propTypes = {
	title: PropTypes.string,
	tmid: PropTypes.string,
	prid: PropTypes.string,
	scale: PropTypes.number,
	connecting: PropTypes.bool,
	theme: PropTypes.string
};

const Header = React.memo(({
	title, subtitle, type, status, usersTyping, width, height, prid, tmid, widthOffset, connecting, goRoomActionsView, roomUserId, theme
}) => {
	const portrait = height > width;
	let scale = 1;

	if (!portrait && !tmid) {
		if (usersTyping.length > 0 || subtitle) {
			scale = 0.8;
		}
	}

	const onPress = () => goRoomActionsView();

	return (
		<TouchableOpacity
			testID='room-view-header-actions'
			onPress={onPress}
			style={[styles.container, { width: width - widthOffset }]}
			disabled={tmid}
		>
			<View style={[styles.titleContainer, tmid && styles.threadContainer]}>
				<Icon type={prid ? 'discussion' : type} status={status} roomUserId={roomUserId} theme={theme} />
				<HeaderTitle
					title={title}
					tmid={tmid}
					prid={prid}
					scale={scale}
					connecting={connecting}
					theme={theme}
				/>
			</View>
			{tmid ? null : <SubTitle usersTyping={usersTyping} subtitle={subtitle} theme={theme} />}
		</TouchableOpacity>
	);
});

Header.propTypes = {
	title: PropTypes.string.isRequired,
	subtitle: PropTypes.string,
	type: PropTypes.string.isRequired,
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	prid: PropTypes.string,
	tmid: PropTypes.string,
	status: PropTypes.string,
	theme: PropTypes.string,
	usersTyping: PropTypes.array,
	widthOffset: PropTypes.number,
	connecting: PropTypes.bool,
	roomUserId: PropTypes.string,
	goRoomActionsView: PropTypes.func
};

Header.defaultProps = {
	usersTyping: []
};

export default Header;
