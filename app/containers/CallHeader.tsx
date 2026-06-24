import { type ReactElement } from 'react';
import { Text, View } from 'react-native';
import { A11y } from 'react-native-a11y-order';
import { StyleSheet } from 'react-native-unistyles';

import { useAppSelector } from '../lib/hooks/useAppSelector';
import { useTheme } from '../theme';
import sharedStyles from '../views/Styles';
import { CustomIcon } from './CustomIcon';
import { BUTTON_HIT_SLOP } from './message/utils';
import AvatarContainer from './Avatar';
import StatusContainer from './Status';
import DotsLoader from './DotsLoader';
import I18n from '../i18n';
import Touch from './Touch';

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

export const CallHeader = ({ mic, cam, setCam, setMic, title, avatar, uid, name, direct }: TCallHeader): ReactElement => {
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
		<A11y.Order>
			<View>
				<View style={styles.actionSheetHeader}>
					<View style={styles.rowContainer}>
						<Text style={styles.actionSheetHeaderTitle}>{title}</Text>
						{calling && direct ? <DotsLoader /> : null}
					</View>
					<View style={styles.actionSheetHeaderButtons}>
						<A11y.Index index={1}>
							<Touch
								accessibilityLabel={cam ? I18n.t('Turn_camera_off') : I18n.t('Turn_camera_on')}
								onPress={() => setCam(!cam)}
								style={[styles.iconCallContainerRight, { backgroundColor: handleColors(cam).button }]}
								hitSlop={BUTTON_HIT_SLOP}
								enabled={!calling}>
								<CustomIcon name={cam ? 'camera-filled' : 'camera-disabled'} size={24} color={handleColors(cam).icon} />
							</Touch>
						</A11y.Index>
						<A11y.Index index={2}>
							<Touch
								accessibilityLabel={mic ? I18n.t('Turn_mic_off') : I18n.t('Turn_mic_on')}
								onPress={() => setMic(!mic)}
								style={[styles.iconCallContainer, { backgroundColor: handleColors(mic).button }]}
								hitSlop={BUTTON_HIT_SLOP}
								enabled={!calling}>
								<CustomIcon name={mic ? 'mic' : 'mic-off'} size={24} color={handleColors(mic).icon} />
							</Touch>
						</A11y.Index>
					</View>
				</View>
				<View style={styles.actionSheetUsernameContainer}>
					<AvatarContainer text={avatar} size={36} />
					{direct ? <StatusContainer size={16} id={uid} style={styles.statusContainerMargin} /> : null}
					<Text style={[styles.actionSheetUsername, { marginLeft: !direct ? 8 : 0 }]} numberOfLines={1}>
						{name}
					</Text>
				</View>
			</View>
		</A11y.Order>
	);
};

const styles = StyleSheet.create(theme => ({
	actionSheetHeader: { flexDirection: 'row', alignItems: 'center' },
	actionSheetHeaderTitle: {
		fontSize: 14,
		...sharedStyles.textBold,
		color: theme.colors.fontDefault
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
		color: theme.colors.fontDefault,
		flexShrink: 1
	},
	rowContainer: { flexDirection: 'row' },
	statusContainerMargin: { marginLeft: 8, marginRight: 6 }
}));
