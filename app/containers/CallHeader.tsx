import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { useAppSelector } from '../lib/hooks';
import { useTheme } from '../theme';
import sharedStyles from '../views/Styles';
import { CustomIcon } from './CustomIcon';
import { BUTTON_HIT_SLOP } from './message/utils';
import AvatarContainer from './Avatar';
import StatusContainer from './Status';
import DotsLoader from './DotsLoader';

type TCallHeader = {
	mic: boolean;
	cam: boolean;
	setCam: Function;
	setMic: Function;
	title: string;
	avatar: string;
	uid: string;
	name: string;
	direct: boolean;
};

export const CallHeader = ({ mic, cam, setCam, setMic, title, avatar, uid, name, direct }: TCallHeader): React.ReactElement => {
	const style = useStyle();
	const { colors } = useTheme();
	const calling = useAppSelector(state => state.videoConf.calling);

	const handleColors = (enabled: boolean) => {
		if (calling) {
			if (enabled) return { button: colors.buttonBackgroundSecondaryDisabled, icon: colors.strokeExtraDark };
			return { button: 'transparent', icon: colors.strokeLight };
		}
		if (enabled) return { button: colors.buttonBackgroundPrimaryDefault, icon: colors.surfaceLight };
		return { button: 'transparent', icon: colors.strokeExtraDark };
	};

	return (
		<View>
			<View style={style.actionSheetHeader}>
				<View style={style.rowContainer}>
					<Text style={style.actionSheetHeaderTitle}>{title}</Text>
					{calling && direct ? <DotsLoader /> : null}
				</View>
				<View style={style.actionSheetHeaderButtons}>
					<Touchable
						onPress={() => setCam(!cam)}
						style={[style.iconCallContainerRight, { backgroundColor: handleColors(cam).button }]}
						hitSlop={BUTTON_HIT_SLOP}
						disabled={calling}>
						<CustomIcon name={cam ? 'camera' : 'camera-disabled'} size={24} color={handleColors(cam).icon} />
					</Touchable>
					<Touchable
						onPress={() => setMic(!mic)}
						style={[style.iconCallContainer, { backgroundColor: handleColors(mic).button }]}
						hitSlop={BUTTON_HIT_SLOP}
						disabled={calling}>
						<CustomIcon name={mic ? 'microphone' : 'microphone-disabled'} size={24} color={handleColors(mic).icon} />
					</Touchable>
				</View>
			</View>
			<View style={style.actionSheetUsernameContainer}>
				<AvatarContainer text={avatar} size={36} />
				{direct ? <StatusContainer size={16} id={uid} style={style.statusContainerMargin} /> : null}
				<Text style={{ ...style.actionSheetUsername, marginLeft: !direct ? 8 : 0 }} numberOfLines={1}>
					{name}
				</Text>
			</View>
		</View>
	);
};

function useStyle() {
	const { colors } = useTheme();
	const style = StyleSheet.create({
		actionSheetHeader: { flexDirection: 'row', alignItems: 'center' },
		actionSheetHeaderTitle: {
			fontSize: 14,
			...sharedStyles.textBold,
			color: colors.fontDefault
		},
		actionSheetHeaderButtons: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end' },
		iconCallContainer: {
			padding: 6,
			borderRadius: 4
		},
		iconCallContainerRight: {
			padding: 6,
			borderRadius: 4,
			marginRight: 6
		},
		actionSheetUsernameContainer: { flexDirection: 'row', paddingTop: 8, alignItems: 'center' },
		actionSheetUsername: {
			fontSize: 16,
			...sharedStyles.textBold,
			color: colors.fontDefault,
			flexShrink: 1
		},
		rowContainer: { flexDirection: 'row' },
		statusContainerMargin: { marginLeft: 8, marginRight: 6 }
	});
	return style;
}
