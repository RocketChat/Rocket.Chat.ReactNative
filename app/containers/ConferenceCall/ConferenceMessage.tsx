import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '~/containers/Button';
import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

export interface IConferenceMessageAction {
	title: string;
	onPress: () => void;
	type?: 'primary' | 'secondary';
	testID: string;
}

interface IConferenceMessage {
	title: string;
	description?: string;
	icon?: TIconsName;
	actions: IConferenceMessageAction[];
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 24,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16
	},
	title: {
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter,
		fontSize: 20,
		lineHeight: 28
	},
	description: {
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter,
		fontSize: 14,
		lineHeight: 20
	},
	actions: {
		width: '100%',
		marginTop: 8
	}
});

const ConferenceMessage = ({ title, description, icon, actions }: IConferenceMessage): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={styles.container} testID='conference-message'>
			{icon ? <CustomIcon name={icon} size={48} color={colors.fontSecondaryInfo} /> : null}
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{title}</Text>
			{description ? <Text style={[styles.description, { color: colors.fontDefault }]}>{description}</Text> : null}
			<View style={styles.actions}>
				{actions.map(({ title: actionTitle, onPress, type = 'primary', testID }) => (
					<Button key={testID} title={actionTitle} type={type} onPress={onPress} testID={testID} />
				))}
			</View>
		</View>
	);
};

export default ConferenceMessage;
