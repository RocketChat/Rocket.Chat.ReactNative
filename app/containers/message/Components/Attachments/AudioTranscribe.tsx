import React, { Suspense, lazy, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import I18n from '../../../../i18n';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';

// Lazy-load the runner so `react-native-executorch` (and its native JSI
// bindings — see SECURITY_REVIEW_REACT_NATIVE_EXECUTORCH.md §11.1) is only
// pulled into the JS bundle and initialised when the user actually opts in.
const TranscriptionRunner = lazy(() => import('./TranscriptionRunner'));

interface IAudioTranscribeProps {
	uri: string;
	enabled: boolean;
}

const styles = StyleSheet.create({
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
	loading: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		paddingVertical: 6,
		paddingHorizontal: 12,
		gap: 8
	}
});

const RunnerFallback = () => {
	const { colors } = useTheme();
	return (
		<View style={styles.loading}>
			<ActivityIndicator size='small' color={colors.fontDefault} />
			<Text style={[styles.buttonLabel, { color: colors.fontDefault }]}>{I18n.t('Translating')}</Text>
		</View>
	);
};

const AudioTranscribe = ({ uri, enabled }: IAudioTranscribeProps) => {
	const { colors } = useTheme();
	const [started, setStarted] = useState(false);

	if (!enabled || !uri) return null;

	if (started) {
		return (
			<Suspense fallback={<RunnerFallback />}>
				<TranscriptionRunner uri={uri} />
			</Suspense>
		);
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
