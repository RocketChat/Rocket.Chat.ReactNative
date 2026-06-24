import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useActionSheet } from './ActionSheet';
import I18n from '../i18n';
import sharedStyles from '../views/Styles';

const styles = StyleSheet.create(theme => ({
	container: {
		position: 'absolute',
		bottom: 12,
		right: 12,
		alignSelf: 'flex-start',
		paddingHorizontal: 4,
		borderRadius: 4,
		height: 20,
		justifyContent: 'center',
		backgroundColor: theme.colors.surfaceNeutral
	},
	label: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textBold,
		color: theme.colors.fontTitlesLabels
	},
	altTextContent: {
		...sharedStyles.containerScrollView
	},
	altTextTitle: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 12,
		...sharedStyles.textSemibold,
		color: theme.colors.fontTitlesLabels
	},
	altTextBody: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textRegular,
		color: theme.colors.fontDefault
	}
}));

const AltTextActionSheetContent = ({ altText }: { altText: string }) => {
	'use memo';

	return (
		<View style={styles.altTextContent}>
			<Text style={styles.altTextTitle}>{I18n.t('Alt_text')}</Text>
			<Text style={styles.altTextBody}>{altText}</Text>
		</View>
	);
};

type TAltTextLabelProps = {
	altText?: string;
	testID?: string;
};

const AltTextLabel = ({ altText, testID }: TAltTextLabelProps) => {
	'use memo';

	const { showActionSheet } = useActionSheet();

	if (!altText) {
		return null;
	}

	const handleOpenAltText = () => {
		showActionSheet({
			children: <AltTextActionSheetContent altText={altText} />
		});
	};

	return (
		<Pressable
			accessible
			testID={testID}
			onPress={handleOpenAltText}
			accessibilityRole='button'
			accessibilityLabel={I18n.t('Alt_text')}
			style={styles.container}>
			<Text style={styles.label}>{I18n.t('Alt')}</Text>
		</Pressable>
	);
};

AltTextLabel.displayName = 'AltTextLabel';

export default AltTextLabel;
