import React, { useCallback } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import { MarkdownPreview } from '../markdown';
import RoomTypeIcon from '../RoomTypeIcon';
import { TUserStatus, IOmnichannelSource } from '../../definitions';
import { useTheme } from '../../theme';
import { useAppSelector } from '../../lib/hooks';
import useStatusAccessibilityLabel from '../../lib/hooks/useStatusAccessibilityLabel';

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

type TRoomHeaderSubTitle = {
	usersTyping: [];
	subtitle?: string;
	renderFunc?: () => React.ReactElement;
	scale: number;
};

type TRoomHeaderHeaderTitle = {
	title?: string;
	tmid?: string;
	prid?: string;
	scale: number;
	testID?: string;
};

interface IRoomHeader {
	title?: string;
	subtitle?: string;
	type: string;
	width: number;
	height: number;
	roomUserId?: string | null;
	prid?: string;
	tmid?: string;
	teamMain?: boolean;
	status?: TUserStatus;
	usersTyping: [];
	isGroupChat?: boolean;
	parentTitle?: string;
	onPress: Function;
	testID?: string;
	sourceType?: IOmnichannelSource;
	disabled?: boolean;
	rightButtonsWidth?: number;
}

const SubTitle = React.memo(({ usersTyping, subtitle, renderFunc, scale }: TRoomHeaderSubTitle) => {
	const { colors } = useTheme();
	const fontSize = getSubTitleSize(scale);
	// typing
	if (usersTyping.length) {
		let usersText;
		if (usersTyping.length === 2) {
			usersText = usersTyping.join(` ${I18n.t('and')} `);
		} else {
			usersText = usersTyping.join(', ');
		}
		return (
			<Text style={[styles.subtitle, { fontSize, color: colors.fontSecondaryInfo }]} numberOfLines={1}>
				<Text style={styles.typingUsers}>{usersText} </Text>
				{usersTyping.length > 1 ? I18n.t('are_typing') : I18n.t('is_typing')}...
			</Text>
		);
	}

	// renderFunc
	if (renderFunc) {
		return renderFunc();
	}

	// subtitle
	if (subtitle) {
		return <MarkdownPreview msg={subtitle} style={[styles.subtitle, { fontSize, color: colors.fontSecondaryInfo }]} />;
	}

	return null;
});

const HeaderTitle = React.memo(({ title, tmid, prid, scale, testID }: TRoomHeaderHeaderTitle) => {
	const { colors } = useTheme();
	const titleStyle = { fontSize: TITLE_SIZE * scale, color: colors.fontTitlesLabels };
	if (!tmid && !prid) {
		return (
			<Text style={[styles.title, titleStyle]} numberOfLines={1} testID={testID}>
				{title}
			</Text>
		);
	}

	return <MarkdownPreview msg={title} style={[styles.title, titleStyle]} testID={testID} />;
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
		roomUserId,
		prid,
		tmid,
		onPress,
		isGroupChat,
		teamMain,
		testID,
		usersTyping = [],
		sourceType,
		disabled
	}: IRoomHeader) => {
		const statusAccessibilityLabel = useStatusAccessibilityLabel({
			isGroupChat,
			prid,
			roomUserId,
			status,
			teamMain,
			type
		});
		const { colors } = useTheme();
		const { fontScale } = useWindowDimensions();
		const portrait = height > width;
		let scale = 1;
		const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
		const subtitleAccessibilityLabel = tmid ? parentTitle : subtitle;
		const accessibilityLabel = `${statusAccessibilityLabel} ${title} ${subtitleAccessibilityLabel ?? ''}.`;

		if (!portrait && !tmid && !isMasterDetail) {
			if (usersTyping.length > 0 || subtitle) {
				scale = 0.8;
			}
		}

		let renderFunc;
		if (tmid) {
			renderFunc = () => (
				<View style={styles.titleContainer}>
					<RoomTypeIcon
						userId={roomUserId}
						type={prid ? 'discussion' : type}
						isGroupChat={isGroupChat}
						status={status}
						teamMain={teamMain}
					/>
					<Text style={[styles.subtitle, { color: colors.fontSecondaryInfo }]} numberOfLines={1}>
						{parentTitle}
					</Text>
				</View>
			);
		}

		const handleOnPress = useCallback(() => onPress(), []);

		return (
			<View
				style={[styles.container, { opacity: disabled ? 0.5 : 1, height: 36.9 * fontScale }]}
				accessibilityLabel={accessibilityLabel}
				accessibilityRole='header'>
				<TouchableOpacity testID='room-header' onPress={handleOnPress} disabled={disabled} hitSlop={HIT_SLOP}>
					<View style={styles.titleContainer}>
						{tmid ? null : (
							<RoomTypeIcon
								userId={roomUserId}
								type={prid ? 'discussion' : type}
								isGroupChat={isGroupChat}
								status={status}
								teamMain={teamMain}
								sourceType={sourceType}
							/>
						)}
						<HeaderTitle title={title} tmid={tmid} prid={prid} scale={scale} testID={testID} />
					</View>
					<SubTitle usersTyping={tmid ? [] : usersTyping} subtitle={subtitle} renderFunc={renderFunc} scale={scale} />
				</TouchableOpacity>
			</View>
		);
	}
);

export default Header;
