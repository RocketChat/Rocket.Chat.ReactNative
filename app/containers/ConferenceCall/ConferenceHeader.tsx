import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { formatCallTimer } from '~/lib/methods/helpers/formatCallTimer';
import { isSpeakerOutput } from '~/lib/methods/helpers/isSpeakerOutput';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { getAudioOutputIcon } from './buildConferenceMenuOptions';
import ConferenceControlButton from './ConferenceControlButton';

interface IConferenceHeader {
	elapsedSeconds: number;
	title?: string;
	peopleCount: number;
	audioOutput: string;
	onAudioOutputPress: () => void;
	chatUnread: number;
	chatDisabled: boolean;
	onPeoplePress: () => void;
	onChatPress: () => void;
	pills?: ReactElement | null;
}

const HEADER_BUTTON_SIZE = 36;
const MAX_UNREAD_BADGE = 99;

const styles = StyleSheet.create({
	header: {
		minHeight: 48,
		paddingHorizontal: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	title: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	timer: {
		...sharedStyles.textBold,
		fontSize: 16,
		lineHeight: 24,
		fontVariant: ['tabular-nums']
	},
	divider: {
		width: StyleSheet.hairlineWidth,
		height: 20
	},
	name: {
		...sharedStyles.textRegular,
		flex: 1,
		fontSize: 16,
		lineHeight: 24
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	pills: {
		paddingHorizontal: 12,
		paddingBottom: 8,
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 8
	}
});

const ConferenceHeader = ({
	elapsedSeconds,
	title,
	peopleCount,
	audioOutput,
	onAudioOutputPress,
	chatUnread,
	chatDisabled,
	onPeoplePress,
	onChatPress,
	pills
}: IConferenceHeader): ReactElement => {
	const { colors } = useTheme();

	return (
		<View testID='conference-header'>
			<View style={styles.header}>
				<View style={styles.title}>
					<Text style={[styles.timer, { color: colors.fontTitlesLabels }]} testID='conference-timer'>
						{formatCallTimer(elapsedSeconds)}
					</Text>
					{title ? (
						<>
							<View style={[styles.divider, { backgroundColor: colors.strokeMedium }]} />
							<Text style={[styles.name, { color: colors.fontTitlesLabels }]} numberOfLines={1}>
								{title}
							</Text>
						</>
					) : null}
				</View>
				<View style={styles.actions}>
					<ConferenceControlButton
						icon={getAudioOutputIcon(audioOutput)}
						label={I18n.t('Audio_output')}
						onPress={onAudioOutputPress}
						variant={isSpeakerOutput(audioOutput) ? 'toggled' : 'default'}
						size={HEADER_BUTTON_SIZE}
						testID='conference-speaker-button'
					/>
					<ConferenceControlButton
						icon='team'
						label={I18n.t('People')}
						onPress={onPeoplePress}
						size={HEADER_BUTTON_SIZE}
						badge={peopleCount}
						testID='conference-people-button'
					/>
					<ConferenceControlButton
						icon='message'
						label={I18n.t('Chat')}
						onPress={onChatPress}
						disabled={chatDisabled}
						badge={chatUnread > MAX_UNREAD_BADGE ? `${MAX_UNREAD_BADGE}+` : chatUnread}
						size={HEADER_BUTTON_SIZE}
						testID='conference-chat-button'
					/>
				</View>
			</View>
			{pills ? <View style={styles.pills}>{pills}</View> : null}
		</View>
	);
};

export default ConferenceHeader;
