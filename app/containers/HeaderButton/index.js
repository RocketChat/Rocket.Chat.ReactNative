import React from 'react';
import PropTypes from 'prop-types';

import { isIOS } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import HeaderButtonContainer from './HeaderButtonContainer';
import HeaderButtonItem from './HeaderButtonItem';

export { HeaderButtonContainer, HeaderButtonItem };

export const DrawerButton = React.memo(({ navigation, testID, ...props }) => (
	<HeaderButtonContainer left>
		<HeaderButtonItem iconName='hamburguer' onPress={navigation.toggleDrawer} testID={testID} {...props} />
	</HeaderButtonContainer>
));

export const CloseModalButton = React.memo(({
	navigation, testID, onPress = () => navigation.pop(), ...props
}) => (
	<HeaderButtonContainer left>
		<HeaderButtonItem iconName='close' onPress={onPress} testID={testID} {...props} />
	</HeaderButtonContainer>
));

export const CancelModalButton = React.memo(({ onPress, testID }) => (
	<HeaderButtonContainer left>
		{isIOS
			? <HeaderButtonItem title={I18n.t('Cancel')} onPress={onPress} testID={testID} />
			: <HeaderButtonItem iconName='close' onPress={onPress} testID={testID} />
		}
	</HeaderButtonContainer>
));

export const MoreButton = React.memo(({ onPress, testID }) => (
	<HeaderButtonContainer>
		<HeaderButtonItem iconName='kebab' onPress={onPress} testID={testID} />
	</HeaderButtonContainer>
));

export const SaveButton = React.memo(({ onPress, testID, ...props }) => (
	<HeaderButtonContainer>
		<HeaderButtonItem iconName='download' onPress={onPress} testID={testID} {...props} />
	</HeaderButtonContainer>
));

export const PreferencesButton = React.memo(({ onPress, testID, ...props }) => (
	<HeaderButtonContainer>
		<HeaderButtonItem iconName='settings' onPress={onPress} testID={testID} {...props} />
	</HeaderButtonContainer>
));

export const LegalButton = React.memo(({ navigation, testID }) => (
	<MoreButton onPress={() => navigation.navigate('LegalView')} testID={testID} />
));

DrawerButton.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired
};
CloseModalButton.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired,
	onPress: PropTypes.func
};
CancelModalButton.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
MoreButton.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
SaveButton.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
PreferencesButton.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
LegalButton.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired
};
