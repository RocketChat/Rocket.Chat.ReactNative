import React from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as List from '../../../containers/List';
import { useTheme } from '../../../theme';
import styles from './styles';
import Button from '../../../containers/Button';
import { useVideoConf } from '../useVideoConf';
import { useVoip } from '../useVoip';
import useUserData from '../useUserData';
import { useActionSheet } from '../../../containers/ActionSheet';

const ROW_HEIGHT = 60;
const MAX_ROWS = 2;

function StartCallActionSheet({ rid, ruid }: { ruid: string; rid: string }): React.ReactElement {
	const user = useUserData(ruid);
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const { hideActionSheet } = useActionSheet();

	const { callEnabled, showInitCallActionSheet } = useVideoConf(rid);
	const { startCall: startVoiceCall } = useVoip();

	const options = [
		{
			id: 'start-voice-call',
			label: 'Voice call',
			icon: '',
			enabled: true,
			onPress: () => {
				startVoiceCall(user.freeSwitchExtension as string);
				hideActionSheet();
			}
		},
		{
			id: 'start-video-call',
			label: 'Video call',
			icon: '',
			enabled: callEnabled,
			onPress: () => {
				hideActionSheet();
				setTimeout(() => showInitCallActionSheet(), 500);
			}
		}
	];

	const renderItem = ({ item }: { item: { id: string; icon: string; label: string; onPress(): void } }) => (
		<Button
			title={item.label}
			type='secondary'
			onPress={item.onPress}
			style={styles.button}
			color={colors.badgeBackgroundLevel2}
			backgroundColor={colors.surfaceRoom}
			styleText={[styles.buttonText, { textAlign: 'center', color: colors.fontInfo }]}
		/>
	);

	return (
		<View
			style={{
				backgroundColor: colors.surfaceRoom,
				borderColor: colors.strokeLight,
				marginBottom: insets.bottom
			}}>
			<FlatList
				style={{ maxHeight: MAX_ROWS * ROW_HEIGHT }}
				data={options}
				keyExtractor={item => item.id}
				renderItem={renderItem}
				ItemSeparatorComponent={List.Separator}
				keyboardShouldPersistTaps='always'
			/>
		</View>
	);
}

export default StartCallActionSheet;
