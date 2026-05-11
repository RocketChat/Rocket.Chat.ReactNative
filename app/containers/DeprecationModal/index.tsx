import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import Modal from 'react-native-modal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Button from '../Button';
import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { isIOS } from '../../lib/methods/helpers/deviceInfo';
import { isOfficial } from '../../lib/constants/environment';
import log from '../../lib/methods/helpers/log';
import styles from './styles';

const OFFICIAL_APP_STORE_URL = 'https://apps.apple.com/us/app/rocket-chat/id1148741252';
const OFFICIAL_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=chat.rocket.android';

const TITLE = 'Rocket.Chat Experimental is being retired';
const BODY =
	'Please install the official Rocket.Chat app and sign back in to your workspace. This Experimental build will stop receiving updates.';
const CONTINUE_LABEL = 'Continue to app';
const URL_LABEL = 'Or open this link manually:';

const DeprecationModal = React.memo(() => {
	const { colors } = useTheme();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail as boolean);
	const [visible, setVisible] = useState(!isOfficial);

	if (isOfficial) {
		return null;
	}

	const storeUrl = isIOS ? OFFICIAL_APP_STORE_URL : OFFICIAL_PLAY_STORE_URL;
	const storeButtonLabel = isIOS ? 'Open App Store' : 'Open Play Store';

	const onOpenStore = async () => {
		try {
			await Linking.openURL(storeUrl);
		} catch (e) {
			log(e);
		}
	};

	const onDismiss = () => {
		setVisible(false);
	};

	const color = colors.fontTitlesLabels;

	return (
		<Modal
			customBackdrop={<View aria-hidden style={[styles.overlay, { backgroundColor: colors.overlayBackground }]} />}
			avoidKeyboard
			useNativeDriver
			isVisible={visible}
			hideModalContentWhileAnimating>
			<GestureHandlerRootView style={styles.container} testID='deprecation-modal'>
				<View
					style={[
						styles.content,
						isMasterDetail && [sharedStyles.modalFormSheet, styles.tablet],
						{ backgroundColor: colors.surfaceTint }
					]}>
					<Text style={[styles.title, { color }]}>{TITLE}</Text>
					<Text style={[styles.body, { color }]}>{BODY}</Text>
					<Text style={[styles.urlLabel, { color }]}>{URL_LABEL}</Text>
					<Text selectable style={[styles.url, { color: colors.fontInfo }]}>
						{storeUrl}
					</Text>
					<View style={styles.buttonContainer}>
						<Button
							title={storeButtonLabel}
							type='primary'
							style={styles.button}
							onPress={onOpenStore}
							testID='deprecation-modal-open-store'
						/>
						<Button
							title={CONTINUE_LABEL}
							type='secondary'
							style={styles.button}
							onPress={onDismiss}
							testID='deprecation-modal-dismiss'
						/>
					</View>
				</View>
			</GestureHandlerRootView>
		</Modal>
	);
});

export default DeprecationModal;
