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

const ActivityIndicator = React.memo(({ users, action }) => {
	const getUsersText = (performingUsers = []) => {
		let usersText;
		if (performingUsers.length === 2) {
			usersText = performingUsers.join(` ${ I18n.t('and') } `);
		} else {
			usersText = performingUsers.join(', ');
		}
		return usersText;
	};

	return (
		<Text>
			<Text style={[styles.subtitle, styles.typingUsers]}>{getUsersText(users)} </Text>
			{ users.length > 1 ? I18n.t(`are_${ action }`) : I18n.t(`is_${ action }`) }...
		</Text>
	);
});

ActivityIndicator.propTypes = {
	action: PropTypes.string,
	users: PropTypes.array
};

const UserActivity = React.memo(({ activities, tmid, rid }) => {
	const { typing, uploading, recording } = activities;
	const id = !tmid ? rid : tmid;

	let users = typing?.[id] ? typing[id] : [];
	if (users.length > 0) {
		return <ActivityIndicator action='typing' users={users} />;
	}

	users = recording?.[id] ? recording[id] : [];
	if (users.length > 0) {
		return <ActivityIndicator action='recording' users={users} />;
	}

	users = uploading?.[id] ? uploading[id] : [];
	if (users.length > 0) {
		return <ActivityIndicator action='uploading' users={users} />;
	}

	return null;
});

UserActivity.propTypes = {
	activities: PropTypes.shape({
		typing: PropTypes.object,
		recording: PropTypes.object,
		uploading: PropTypes.object
	}),
	tmid: PropTypes.string,
	rid: PropTypes.string
};

const SubTitle = React.memo(({
	subtitle, renderFunc, theme, scale
}) => {
	const fontSize = getSubTitleSize(scale);
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
	usersActivity: PropTypes.shape({
		typing: PropTypes.array,
		recording: PropTypes.array,
		uploading: PropTypes.array
	}),
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
	title, subtitle, parentTitle, type, status, usersActivity, width, height, rid, prid, tmid, onPress, theme, isGroupChat, teamMain, testID
}) => {
	const portrait = height > width;
	let scale = 1;

	if (!portrait && !tmid) {
		if (usersActivity.typing.length > 0 || subtitle) {
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
				tmid={tmid}
				rid={rid}
				// usersActivity={usersActivity}
				subtitle={subtitle}
				theme={theme}
				renderFunc={renderFunc}
				scale={scale}
			/>
			<UserActivity activities={usersActivity} tmid={tmid} rid={rid} />
		</TouchableOpacity>
	);
});

Header.propTypes = {
	title: PropTypes.string.isRequired,
	subtitle: PropTypes.string,
	type: PropTypes.string.isRequired,
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	rid: PropTypes.string,
	prid: PropTypes.string,
	tmid: PropTypes.string,
	teamMain: PropTypes.bool,
	status: PropTypes.string,
	theme: PropTypes.string,
	usersActivity: PropTypes.shape({
		typing: PropTypes.object,
		recording: PropTypes.object,
		uploading: PropTypes.object
	}),
	isGroupChat: PropTypes.bool,
	parentTitle: PropTypes.string,
	onPress: PropTypes.func,
	testID: PropTypes.string
};

Header.defaultProps = {
	usersActivity: { typing: {}, recording: {}, uploading: {} }
};

export default withTheme(Header);
