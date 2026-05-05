import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import I18n from '../../../../i18n';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { useAudioTranscription } from '../../hooks/useAudioTranscription';

interface IAudioTranscribeProps {
	uri: string;
	enabled: boolean;
}

const styles = StyleSheet.create({
	container: {
		gap: 6
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 4,
		gap: 8
	},
	buttonLabel: {
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	transcript: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	error: {
		fontSize: 13,
		...sharedStyles.textRegular
	}
});

const TranscriptionRunner = ({ uri }: { uri: string }) => {
	const { colors } = useTheme();
	const { status, text, downloadProgress } = useAudioTranscription(uri);

	const isWorking = status === 'loading-model' || status === 'transcribing';
	let label = I18n.t('Translating');
	if (status === 'loading-model' && downloadProgress > 0 && downloadProgress < 1) {
		label = `${I18n.t('Translating')} ${Math.round(downloadProgress * 100)}%`;
	}

	return (
		<View style={styles.container}>
			{isWorking ? (
				<View style={[styles.button, { backgroundColor: colors.buttonBackgroundPrimaryDisabled }]}>
					<ActivityIndicator size='small' color={colors.fontWhite} />
					<Text style={[styles.buttonLabel, { color: colors.fontWhite }]}>{label}</Text>
				</View>
			) : null}
			{status === 'done' && text ? <Text style={[styles.transcript, { color: colors.fontDefault }]}>{text}</Text> : null}
			{status === 'error' ? (
				<Text style={[styles.error, { color: colors.fontDanger }]}>{I18n.t('Translation_failed')}</Text>
			) : null}
		</View>
	);
};

const AudioTranscribe = ({ uri, enabled }: IAudioTranscribeProps) => {
	const { colors } = useTheme();
	const [started, setStarted] = useState(false);

	if (!enabled || !uri) return null;

	if (started) {
		return <TranscriptionRunner uri={uri} />;
	}

	return (
		<TouchableOpacity
			accessibilityRole='button'
			accessibilityLabel={I18n.t('Translate')}
			onPress={() => setStarted(true)}
			style={[styles.button, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]}>
			<Text style={[styles.buttonLabel, { color: colors.fontWhite }]}>{I18n.t('Translate')}</Text>
		</TouchableOpacity>
	);
};

export default AudioTranscribe;
