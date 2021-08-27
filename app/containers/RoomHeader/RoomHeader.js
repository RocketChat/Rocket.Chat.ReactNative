import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, TouchableOpacity
} from 'react-native';

import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import Markdown from '../markdown';
import RoomTypeIcon from '../RoomTypeIcon';
import { withTheme } from '../../theme';

const HIT_SLOP = {
	top: 5, right: 5, bottom: 5, left: 5
};
const TITLE_SIZE = 16;
const SUBTITLE_SIZE = 12;

const getSubTitleSize = scale => SUBTITLE_SIZE * scale;

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
		flexShrink: 1,
		...sharedStyles.textSemibold
	},
	subtitle: {
		flexShrink: 1,
		...sharedStyles.textRegular
	},
	typingUsers: {
		...sharedStyles.textSemibold
	}
});

const SubTitle = React.memo(({
	usersTyping, subtitle, renderFunc, theme, scale
}) => {
	const fontSize = getSubTitleSize(scale);
	// typing
	if (usersTyping.length) {
		let usersText;
		if (usersTyping.length === 2) {
			usersText = usersTyping.join(` ${ I18n.t('and') } `);
		} else {
			usersText = usersTyping.join(', ');
		}
		return (
			<Text style={[styles.subtitle, { fontSize, color: themes[theme].auxiliaryText }]} numberOfLines={1}>
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
				style={[styles.subtitle, { fontSize, color: themes[theme].auxiliaryText }]}
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
	renderFunc: PropTypes.func,
	scale: PropTypes.number
};

const HeaderTitle = React.memo(({
	title, tmid, prid, scale, theme, testID
}) => {
	const titleStyle = { fontSize: TITLE_SIZE * scale, color: themes[theme].headerTitleColor };
	if (!tmid && !prid) {
		return (
			<Text
				style={[styles.title, titleStyle]}
				numberOfLines={1}
				testID={testID}
			>
				{title}
			</Text>
		);
	}

	return (
		<Markdown
			preview
			msg={title}
			style={[styles.title, titleStyle]}
			numberOfLines={1}
			theme={theme}
			testID={testID}
		/>
	);
});

HeaderTitle.propTypes = {
	title: PropTypes.string,
	tmid: PropTypes.string,
	prid: PropTypes.string,
	scale: PropTypes.number,
	theme: PropTypes.string,
	testID: PropTypes.string
};

const Header = React.memo(({
	title, subtitle, parentTitle, type, status, usersTyping, width, height, prid, tmid, onPress, theme, isGroupChat, teamMain, testID
}) => {
	const portrait = height > width;
	let scale = 1;

	if (!portrait && !tmid) {
		if (usersTyping.length > 0 || subtitle) {
			scale = 0.8;
		}
	}

	let renderFunc;
	if (tmid) {
		renderFunc = () => (
			<View style={styles.titleContainer}>
				<RoomTypeIcon type={prid ? 'discussion' : type} isGroupChat={isGroupChat} status={status} teamMain={teamMain} />
				<Text style={[styles.subtitle, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>{parentTitle}</Text>
			</View>
		);
	}

	const handleOnPress = useCallback(() => onPress(), []);

	return (
		<TouchableOpacity
			testID='room-header'
			accessibilityLabel={title}
			onPress={handleOnPress}
			style={styles.container}
			disabled={tmid}
			hitSlop={HIT_SLOP}
		>
			<View style={styles.titleContainer}>
				{tmid ? null : <RoomTypeIcon type={prid ? 'discussion' : type} isGroupChat={isGroupChat} status={status} teamMain={teamMain} />}
				<HeaderTitle
					title={title}
					tmid={tmid}
					prid={prid}
					scale={scale}
					theme={theme}
					testID={testID}
				/>
			</View>
			<SubTitle
				usersTyping={tmid ? [] : usersTyping}
				subtitle={subtitle}
				theme={theme}
				renderFunc={renderFunc}
				scale={scale}
			/>
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
	teamMain: PropTypes.bool,
	status: PropTypes.string,
	theme: PropTypes.string,
	usersTyping: PropTypes.array,
	isGroupChat: PropTypes.bool,
	parentTitle: PropTypes.string,
	onPress: PropTypes.func,
	testID: PropTypes.string
};

Header.defaultProps = {
	usersTyping: []
};

export default withTheme(Header);
