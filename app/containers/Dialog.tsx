import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import RNDialog from 'react-native-dialog';

import EventEmitter from '../lib/methods/helpers/events';
import { Services } from '../lib/services';
import I18n from '../i18n';
import log, { logEvent } from '../lib/methods/helpers/log';
import events from '../lib/methods/helpers/log/events';
import { useTheme } from '../theme';
import sharedStyles from '../views/Styles';
import { showToast } from '../lib/methods/helpers/showToast';

const styles = StyleSheet.create({
	title: {
		fontSize: 18,
		...sharedStyles.textMedium
	},
	description: {
		fontSize: 15,
		...sharedStyles.textRegular
	},
	buttonText: {
		fontSize: 14,
		...sharedStyles.textSemibold
	}
});

export const LISTENER_DIALOG = 'Dialog';

interface IMessage {
	title: string;
	description: string;
	inputLabel: string;
	data: any;
}

const Dialog = (): React.ReactElement => {
	const { colors } = useTheme();

	const listener = useRef<Function | null>(null);

	const [isVisible, setIsVisible] = useState(false);
	const [text, setText] = useState('');
	const [dialog, setDialog] = useState<IMessage | null>(null);

	const reportMessage = async () => {
		try {
			await Services.reportMessage(dialog?.data?.id, text || 'Message reported by user');
			showToast(I18n.t('Message_Reported'));
		} catch (e) {
			logEvent(events.ROOM_MSG_ACTION_REPORT_F);
			log(e);
		} finally {
			handleCancel();
		}
	};

	const showDialog = (eventData: any) => {
		setIsVisible(true);
		setText('');
		setDialog(eventData.dialog);
	};

	const handleCancel = () => {
		setIsVisible(false);
		setText('');
		setDialog(null);
	};

	useEffect(() => {
		listener.current = EventEmitter.addEventListener(LISTENER_DIALOG, showDialog);
		return () => {
			EventEmitter.removeListener(LISTENER_DIALOG, listener.current as Function);
		};
	}, []);

	return (
		<RNDialog.Container visible={isVisible} onBackdropPress={handleCancel}>
			<RNDialog.Title style={[styles.title, { color: colors.infoText }]}>{dialog?.title}</RNDialog.Title>
			<ScrollView persistentScrollbar style={{ maxHeight: 100, marginBottom: 25 }}>
				<RNDialog.Description style={[styles.description, { color: colors.bodyText }]}>
					{dialog?.description}
				</RNDialog.Description>
			</ScrollView>
			<RNDialog.Input label={dialog?.inputLabel} value={text} onChangeText={setText} />
			<RNDialog.Button style={styles.buttonText} color={colors.cancelButton} label={I18n.t('Cancel')} onPress={handleCancel} />
			<RNDialog.Button
				style={styles.buttonText}
				color={colors.dangerColor}
				label={`${I18n.t('Report')}!`}
				onPress={reportMessage}
			/>
		</RNDialog.Container>
	);
};

export default Dialog;
