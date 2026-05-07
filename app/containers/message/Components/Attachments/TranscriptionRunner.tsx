import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

import I18n from '../../../../i18n';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { useAudioTranscription } from '../../hooks/useAudioTranscription';

// Installing the JSI bindings here (instead of at app boot) keeps the native
// `fetchUrlFunc` gadget out of the process for users who never trigger
// transcription. See SECURITY_REVIEW_REACT_NATIVE_EXECUTORCH.md §11.1.
initExecutorch({ resourceFetcher: ExpoResourceFetcher });

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
	const announcedStartRef = useRef(false);

	const isWorking = status === 'loading-model' || status === 'transcribing';
	let label = I18n.t('Translating');
	if (status === 'loading-model' && downloadProgress > 0 && downloadProgress < 1) {
		label = `${I18n.t('Translating')} ${Math.round(downloadProgress * 100)}%`;
	}

	useEffect(() => {
		if (isWorking && !announcedStartRef.current) {
			announcedStartRef.current = true;
			AccessibilityInfo.announceForAccessibility(I18n.t('Translating'));
		}
	}, [isWorking]);

	useEffect(() => {
		if (status === 'done' && text) {
			AccessibilityInfo.announceForAccessibility(text);
		} else if (status === 'error') {
			AccessibilityInfo.announceForAccessibility(I18n.t('Translation_failed'));
		}
	}, [status, text]);

	return (
		<View style={styles.container}>
			{isWorking ? (
				<View
					accessible
					accessibilityLiveRegion='polite'
					accessibilityLabel={label}
					style={[styles.button, { backgroundColor: colors.buttonBackgroundPrimaryDisabled }]}>
					<ActivityIndicator size='small' color={colors.fontWhite} />
					<Text style={[styles.buttonLabel, { color: colors.fontWhite }]}>{label}</Text>
				</View>
			) : null}
			{status === 'done' && text ? (
				<Text
					accessible
					accessibilityLiveRegion='polite'
					accessibilityLabel={text}
					style={[styles.transcript, { color: colors.fontDefault }]}>
					{text}
				</Text>
			) : null}
			{status === 'error' ? (
				<Text
					accessible
					accessibilityLiveRegion='assertive'
					accessibilityLabel={I18n.t('Translation_failed')}
					style={[styles.error, { color: colors.fontDanger }]}>
					{I18n.t('Translation_failed')}
				</Text>
			) : null}
		</View>
	);
};

export default TranscriptionRunner;
