import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, TouchableOpacity
} from 'react-native';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import Icon from './Icon';
import { themes } from '../../../constants/colors';
import Markdown from '../../../containers/markdown';

const TITLE_SIZE = 16;
const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	},
	titleContainer: {
		alignItems: 'center',
		flexDirection: 'row'
	},
	title: {
		...sharedStyles.textSemibold,
		fontSize: TITLE_SIZE
	},
	subtitle: {
		...sharedStyles.textRegular,
		fontSize: 12
	},
	typingUsers: {
		...sharedStyles.textSemibold
	}
});

const SubTitle = React.memo(({
	usersTyping, subtitle, renderFunc, theme
}) => {
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

	// renderFunc
	if (renderFunc) {
		return renderFunc();
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

	return null;
});

SubTitle.propTypes = {
	usersTyping: PropTypes.array,
	theme: PropTypes.string,
	subtitle: PropTypes.string,
	renderFunc: PropTypes.func
};

const HeaderTitle = React.memo(({
	title, tmid, prid, scale, theme
}) => {
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
	theme: PropTypes.string
};

const Header = React.memo(({
	title, subtitle, parentTitle, type, status, usersTyping, width, height, prid, tmid, connecting, goRoomActionsView, roomUserId, theme
}) => {
	const portrait = height > width;
	let scale = 1;

	if (!portrait && !tmid) {
		if (usersTyping.length > 0 || subtitle) {
			scale = 0.8;
		}
	}

	const onPress = () => goRoomActionsView();

	let renderFunc;
	if (tmid) {
		renderFunc = () => (
			<View style={styles.titleContainer}>
				<Icon
					type={prid ? 'discussion' : type}
					tmid={tmid}
					status={status}
					roomUserId={roomUserId}
					theme={theme}
				/>
				<Text style={[styles.subtitle, { color: themes[theme].auxiliaryText }]}>{parentTitle}</Text>
			</View>
		);
	}

	return (
		<TouchableOpacity
			testID='room-view-header-actions'
			accessibilityLabel={title}
			onPress={onPress}
			style={styles.container}
			disabled={tmid}
		>
			<View style={styles.titleContainer}>
				{tmid ? null : <Icon type={prid ? 'discussion' : type} status={status} roomUserId={roomUserId} theme={theme} />}
				<HeaderTitle
					title={title}
					tmid={tmid}
					prid={prid}
					scale={scale}
					connecting={connecting}
					theme={theme}
				/>
			</View>
			<SubTitle usersTyping={usersTyping} subtitle={subtitle} theme={theme} renderFunc={renderFunc} />
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
	connecting: PropTypes.bool,
	roomUserId: PropTypes.string,
	parentTitle: PropTypes.string,
	goRoomActionsView: PropTypes.func
};

Header.defaultProps = {
	usersTyping: []
};

export default Header;
