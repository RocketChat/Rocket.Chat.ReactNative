import { type ReactElement, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { removeVideoConfCall } from '~/actions/videoConf';
import AvatarContainer from '~/containers/Avatar';
import { CustomIcon } from '~/containers/CustomIcon';
import Ringer, { ERingerSounds } from '~/containers/Ringer';
import Touch from '~/containers/Touch';
import i18n from '~/i18n';
import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import log from '~/lib/methods/helpers/log';
import { hideNotification } from '~/lib/methods/helpers/notifications';
import { videoConfJoin } from '~/lib/methods/videoConf';
import { videoConferenceDecline } from '~/lib/services/restApi';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { useStyle } from './style';

interface IEmbeddedCallNotification {
	notification: { callId: string; rid: string; uid: string };
}

const BUTTON_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

const styles = StyleSheet.create({
	title: {
		...sharedStyles.textBold,
		fontSize: 14
	},
	caller: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingTop: 8
	},
	name: {
		...sharedStyles.textBold,
		flexShrink: 1,
		fontSize: 16
	}
});

const EmbeddedCallNotification = ({ notification: { callId, rid, uid } }: IEmbeddedCallNotification): ReactElement | null => {
	const { colors } = useTheme();
	const style = useStyle();
	const dispatch = useDispatch();
	const insets = useSafeAreaInsets();
	const isMasterDetail = useMasterDetail();
	const { info } = useConferenceInfo(callId);
	const [ringing, setRinging] = useState(true);
	const isRingable = !!info && !info.endedAt && !!info.capabilities?.embedded;

	useEffect(
		() => () => {
			dispatch(removeVideoConfCall({ callId, rid, uid }));
		},
		[dispatch, callId, rid, uid]
	);

	useEffect(() => {
		if (info && !isRingable) {
			hideNotification();
		}
	}, [info, isRingable]);

	if (!info || !isRingable) {
		return null;
	}

	const callerName = info.createdBy.name || info.createdBy.username;
	const name = 'title' in info && info.title ? info.title : callerName;

	const dismiss = () => {
		setRinging(false);
		hideNotification();
	};

	const decline = () => {
		dismiss();
		videoConferenceDecline(callId).catch(log);
	};

	const accept = () => {
		dismiss();
		videoConfJoin(callId, undefined, undefined, { rid });
	};

	return (
		<View
			accessible
			accessibilityRole='button'
			accessibilityLabel={`${i18n.t('Incoming_call_from')} ${name}`}
			testID='embedded-call-notification'
			style={[style.container, isMasterDetail && style.small, { marginTop: insets.top }]}>
			<Text style={[styles.title, { color: colors.fontDefault }]}>{i18n.t('Incoming_call_from')}</Text>
			<View style={styles.caller}>
				<AvatarContainer text={info.createdBy.username} size={36} />
				<Text style={[styles.name, { color: colors.fontDefault }]} numberOfLines={1}>
					{name}
				</Text>
			</View>
			<View style={style.row}>
				<Touch
					hitSlop={BUTTON_HIT_SLOP}
					onPress={dismiss}
					accessibilityLabel={i18n.t('A11y_incoming_call_dismiss')}
					style={style.closeButton}
					rectButtonStyle={style.closeButtonContainer}
					testID='embedded-call-dismiss'>
					<CustomIcon name='close' size={20} />
				</Touch>
				<View style={style.buttonWrapper}>
					<Touch
						hitSlop={BUTTON_HIT_SLOP}
						onPress={decline}
						style={style.cancelButton}
						rectButtonStyle={style.buttonContainer}
						testID='embedded-call-decline'>
						<Text style={style.buttonText}>{i18n.t('decline')}</Text>
					</Touch>
				</View>
				<View style={style.buttonWrapper}>
					<Touch
						hitSlop={BUTTON_HIT_SLOP}
						onPress={accept}
						style={style.acceptButton}
						rectButtonStyle={style.buttonContainer}
						testID='embedded-call-accept'>
						<Text style={style.buttonText}>{i18n.t('accept')}</Text>
					</Touch>
				</View>
			</View>
			{ringing ? <Ringer ringer={ERingerSounds.RINGTONE} /> : null}
		</View>
	);
};

export default EmbeddedCallNotification;
