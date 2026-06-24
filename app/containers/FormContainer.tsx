import { type ReactElement } from 'react';
import { type ScrollViewProps, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../views/Styles';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import AppVersion from './AppVersion';
import { isTablet } from '../lib/methods/helpers';
import SafeAreaView from './SafeAreaView';

interface IFormContainer extends ScrollViewProps {
	testID: string;
	children: ReactElement | ReactElement[] | null;
	showAppVersion?: boolean;
}

const styles = StyleSheet.create(theme => ({
	scrollView: {
		minHeight: '100%'
	},
	background: {
		backgroundColor: theme.colors.surfaceRoom
	}
}));

export const FormContainerInner = ({
	children,
	accessibilityLabel
}: {
	children: (ReactElement | null)[];
	accessibilityLabel?: string;
}) => (
	<View accessibilityLabel={accessibilityLabel} style={[sharedStyles.container, isTablet && sharedStyles.tabletScreenContent]}>
		{children}
	</View>
);

const FormContainer = ({ children, testID, showAppVersion = true, ...props }: IFormContainer) => (
	<KeyboardAwareScrollView
		style={[sharedStyles.container, styles.background]}
		contentContainerStyle={[sharedStyles.containerScrollView, styles.scrollView]}
		bottomOffset={20}
		{...scrollPersistTaps}
		{...props}>
		<SafeAreaView testID={testID} style={styles.background}>
			{children}
			<>{showAppVersion && <AppVersion />}</>
		</SafeAreaView>
	</KeyboardAwareScrollView>
);

export default FormContainer;
