import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useActionSheet } from '../../../../ActionSheet';
import I18n from '../../../../../i18n';
import sharedStyles from '../../../../../views/Styles';
import { useTheme } from '../../../../../theme';
import Touch from '../../../../Touch';

const styles = StyleSheet.create({
	container: {
		alignSelf: 'flex-start',
		paddingHorizontal: 4,
		borderRadius: 4,
		height: 20
	},
	rectButtonStyle: {
		position: 'absolute',
		bottom: 12,
		right: 12
	},
	label: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textBold
	},
	altTextContent: {
		...sharedStyles.containerScrollView
	},
	altTextTitle: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 12,
		...sharedStyles.textSemibold
	},
	altTextBody: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textRegular
	}
});

const AltTextActionSheetContent = ({ altText }: { altText: string }) => {
	'use memo';

	const { colors } = useTheme();

	return (
		<View style={styles.altTextContent}>
			<Text style={[styles.altTextTitle, { color: colors.fontTitlesLabels }]}>{I18n.t('Alt_text')}</Text>
			<Text style={[styles.altTextBody, { color: colors.fontDefault }]}>{altText}</Text>
		</View>
	);
};

type TAltTextLabelProps = {
	altText: string;
	testID?: string;
};

const AltTextLabel = ({ altText, testID }: TAltTextLabelProps) => {
	'use memo';

	const { colors } = useTheme();
	const { showActionSheet } = useActionSheet();

	const handleOpenAltText = React.useCallback(() => {
		if (!altText) {
			return;
		}

		showActionSheet({
			children: <AltTextActionSheetContent altText={altText} />
		});
	}, [altText, showActionSheet]);

	return (
		<Touch
			testID={testID}
			onPress={handleOpenAltText}
			accessibilityRole='button'
			accessibilityLabel={I18n.t('Alt_text')}
			style={[styles.container, { backgroundColor: colors.surfaceNeutral }]}
			rectButtonStyle={styles.rectButtonStyle}>
			<Text style={[styles.label, { color: colors.fontTitlesLabels }]}>{I18n.t('Alt')}</Text>
		</Touch>
	);
};

AltTextLabel.displayName = 'AltTextLabel';

export default AltTextLabel;
