import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import isEmpty from 'lodash/isEmpty';

import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import Markdown from '../markdown';
import RoomTypeIcon from '../RoomTypeIcon';

const HIT_SLOP = {
	top: 5,
	right: 5,
	bottom: 5,
	left: 5
};
const TITLE_SIZE = 16;
const SUBTITLE_SIZE = 12;

const getSubTitleSize = (scale: number) => SUBTITLE_SIZE * scale;

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

type TUserActivity = {
	typing: { [rid: string]: [] };
	uploading: { [rid: string]: [] };
	recording: { [rid: string]: [] };
};

type TRoomHeaderSubTitle = {
	userActivity: TUserActivity;
	theme: string;
	subtitle: string;
	renderFunc: any;
	scale: number;
	roomId: string;
};

type TActivityIndicator = {
	performingUsers: string[];
	fontSize: number;
	theme: string;
	activityName: string;
};

type TRoomHeaderHeaderTitle = {
	title: string;
	tmid: string;
	prid: string;
	scale: number;
	theme: string;
	testID: string;
};

interface IRoomHeader {
	title: string;
	subtitle: string;
	type: string;
	width: number;
	height: number;
	rid: string;
	prid: string;
	tmid: string;
	teamMain: boolean;
	status: string;
	theme: string;
	userActivity: TUserActivity;
	isGroupChat: boolean;
	parentTitle: string;
	onPress: Function;
	testID: string;
}

const ActivityIndicator = ({ performingUsers, fontSize, theme, activityName }: TActivityIndicator) => {
	let usersText;
	if (performingUsers.length === 2) {
		usersText = performingUsers.join(` ${I18n.t('and')} `);
	} else {
		usersText = performingUsers.join(', ');
	}
	return (
		<Text style={[styles.subtitle, { fontSize, color: themes[theme].auxiliaryText }]} numberOfLines={1}>
			<Text style={styles.typingUsers}>{usersText} </Text>
			{performingUsers.length > 1 ? I18n.t('are') : I18n.t('is')} {I18n.t(activityName)}...
		</Text>
	);
};

const SubTitle = React.memo(({ roomId, userActivity, subtitle, renderFunc, theme, scale }: TRoomHeaderSubTitle) => {
	const fontSize = getSubTitleSize(scale);
	if (userActivity?.uploading?.[roomId]?.length) {
		return (
			<ActivityIndicator
				performingUsers={userActivity.uploading[roomId]}
				activityName='uploading'
				fontSize={fontSize}
				theme={theme}
			/>
		);
	}
	if (userActivity?.recording?.[roomId]?.length) {
		return (
			<ActivityIndicator
				performingUsers={userActivity.recording[roomId]}
				activityName='recording'
				fontSize={fontSize}
				theme={theme}
			/>
		);
	}
	if (userActivity?.typing?.[roomId]?.length) {
		return (
			<ActivityIndicator performingUsers={userActivity.typing[roomId]} activityName='typing' fontSize={fontSize} theme={theme} />
		);
	}
	// renderFunc
	if (renderFunc) {
		return renderFunc();
	}

	// subtitle
	if (subtitle) {
		return (
			// @ts-ignore
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

const HeaderTitle = React.memo(({ title, tmid, prid, scale, theme, testID }: TRoomHeaderHeaderTitle) => {
	const titleStyle = { fontSize: TITLE_SIZE * scale, color: themes[theme].headerTitleColor };
	if (!tmid && !prid) {
		return (
			<Text style={[styles.title, titleStyle]} numberOfLines={1} testID={testID}>
				{title}
			</Text>
		);
	}

	return (
		// @ts-ignore
		<Markdown preview msg={title} style={[styles.title, titleStyle]} numberOfLines={1} theme={theme} testID={testID} />
	);
});

const Header = React.memo(
	({
		title,
		subtitle,
		parentTitle,
		type,
		status,
		width,
		height,
		rid,
		prid,
		tmid,
		onPress,
		theme,
		isGroupChat,
		teamMain,
		testID,
		userActivity
	}: IRoomHeader) => {
		const portrait = height > width;
		let scale = 1;

		if (!portrait && !tmid) {
			if (!isEmpty(userActivity) || subtitle) {
				scale = 0.8;
			}
		}

		let renderFunc;
		if (tmid) {
			renderFunc = () => (
				<View style={styles.titleContainer}>
					<RoomTypeIcon type={prid ? 'discussion' : type} isGroupChat={isGroupChat} status={status} teamMain={teamMain} />
					<Text style={[styles.subtitle, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>
						{parentTitle}
					</Text>
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
				// @ts-ignore
				disabled={tmid}
				hitSlop={HIT_SLOP}>
				<View style={styles.titleContainer}>
					{tmid ? null : (
						<RoomTypeIcon type={prid ? 'discussion' : type} isGroupChat={isGroupChat} status={status} teamMain={teamMain} />
					)}
					<HeaderTitle title={title} tmid={tmid} prid={prid} scale={scale} theme={theme} testID={testID} />
				</View>
				<SubTitle
					roomId={tmid || rid}
					userActivity={userActivity}
					subtitle={subtitle}
					theme={theme}
					renderFunc={renderFunc}
					scale={scale}
				/>
			</TouchableOpacity>
		);
	}
);

export default withTheme(Header);
