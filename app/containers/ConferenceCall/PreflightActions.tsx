import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import I18n from '~/i18n';
import Button from '~/containers/Button';

interface IPreflightActions {
	isNew: boolean;
	connecting: boolean;
	loadingInfo: boolean;
	onJoin: () => void;
	onCancel: () => void;
}

const styles = StyleSheet.create({
	footer: {
		paddingHorizontal: 24,
		paddingTop: 12,
		paddingBottom: 12
	}
});

const PreflightActions = ({ isNew, connecting, loadingInfo, onJoin, onCancel }: IPreflightActions): ReactElement => (
	<View style={styles.footer}>
		<Button
			title={isNew ? I18n.t('Start_call') : I18n.t('Join_call')}
			onPress={onJoin}
			loading={connecting || (!isNew && loadingInfo)}
			testID='conference-preflight-join'
		/>
		<Button title={I18n.t('Cancel')} type='secondary' onPress={onCancel} testID='conference-preflight-cancel' />
	</View>
);

export default PreflightActions;
