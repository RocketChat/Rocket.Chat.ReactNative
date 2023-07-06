import { Camera, CameraType } from 'expo-camera';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '..';
import { cancelCall, initVideoCall } from '../../../actions/videoConf';
import AvatarContainer from '../../../containers/Avatar';
import Button from '../../../containers/Button';
import { CallHeader } from '../../../containers/CallHeader';
import Ringer, { ERingerSounds } from '../../../containers/Ringer';
import i18n from '../../../i18n';
import { getUserSelector } from '../../../selectors/login';
import { useTheme } from '../../../theme';
import { isIOS } from '../../methods/helpers';
import useUserData from '../useUserData';

export default function StartACallActionSheet({ rid }: { rid: string }): React.ReactElement {
	const { colors } = useTheme();
	const [mic, setMic] = useState(true);
	const [cam, setCam] = useState(false);
	const [containerWidth, setContainerWidth] = useState(0);

	const username = useAppSelector(state => getUserSelector(state).username);
	const calling = useAppSelector(state => state.videoConf.calling);
	const dispatch = useDispatch();

	const user = useUserData(rid);

	// fix safe area bottom padding on iOS
	const insets = useSafeAreaInsets();
	const paddingBottom = isIOS && insets.bottom ? 8 : 0;

	React.useEffect(
		() => () => {
			if (calling) {
				dispatch(cancelCall({}));
			}
		},
		[calling, dispatch]
	);

	return (
		<View
			style={[style.actionSheetContainer, { paddingBottom }]}
			onLayout={e => setContainerWidth(e.nativeEvent.layout.width / 2)}
		>
			{calling ? <Ringer ringer={ERingerSounds.DIALTONE} /> : null}
			<CallHeader
				title={calling && user.direct ? i18n.t('Calling') : i18n.t('Start_a_call')}
				cam={cam}
				mic={mic}
				setCam={setCam}
				setMic={setMic}
				avatar={user.avatar}
				name={user.username}
				uid={user.uid}
				direct={user.direct}
			/>
			<View
				style={[
					style.actionSheetPhotoContainer,
					{ backgroundColor: cam ? undefined : colors.conferenceCallPhotoBackground, width: containerWidth }
				]}
			>
				{cam ? (
					<Camera style={[style.cameraContainer, { width: containerWidth }]} type={CameraType.front} />
				) : (
					<AvatarContainer size={62} text={username} rid={rid} type={user.type} />
				)}
			</View>
			<Button
				backgroundColor={calling ? colors.conferenceCallCallBackButton : colors.actionTintColor}
				color={calling ? colors.gray300 : colors.conferenceCallEnabledIcon}
				onPress={() => {
					if (calling) {
						dispatch(cancelCall({}));
					} else {
						dispatch(initVideoCall({ cam, mic, direct: user.direct, rid, uid: user.uid }));
					}
				}}
				title={calling ? i18n.t('Cancel') : i18n.t('Call')}
			/>
		</View>
	);
}

const style = StyleSheet.create({
	actionSheetContainer: {
		paddingHorizontal: 24,
		flex: 1
	},
	actionSheetPhotoContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		flex: 1,
		marginVertical: 8,
		borderRadius: 8,
		overflow: 'hidden'
	},
	cameraContainer: {
		flex: 1
	}
});
