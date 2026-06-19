import { type ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';

import Button from '../../containers/Button';
import I18n from '../../i18n';
import ClearAfterPicker, { type ClearAfterValue } from './ClearAfterPicker';

const styles = StyleSheet.create({
	buttonContainer: {
		marginTop: 36,
		paddingHorizontal: 16
	},
	buttonContainerWithPicker: {
		marginTop: 16
	}
});

interface IFooterComponentProps {
	supportsStatusExpiry: boolean;
	clearAfter: ClearAfterValue;
	clearAfterDate: Date | null;
	onClearAfterChange: (value: ClearAfterValue, date: Date | null) => void;
	disabled: boolean;
	onSubmit: () => void;
}

const FooterComponent = ({
	supportsStatusExpiry,
	clearAfter,
	clearAfterDate,
	onClearAfterChange,
	disabled,
	onSubmit
}: IFooterComponentProps): ReactElement => {
	'use memo';

	return (
		<View>
			{supportsStatusExpiry && (
				<ClearAfterPicker value={clearAfter} customDate={clearAfterDate} onChange={onClearAfterChange} />
			)}
			<View style={[styles.buttonContainer, supportsStatusExpiry && styles.buttonContainerWithPicker]}>
				<Button testID='status-view-submit' disabled={disabled} onPress={onSubmit} title={I18n.t('Save')} />
			</View>
		</View>
	);
};

export default FooterComponent;
