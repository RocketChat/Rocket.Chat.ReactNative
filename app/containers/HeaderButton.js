import React from 'react';
import PropTypes from 'prop-types';
import { HeaderButtons, HeaderButton, Item } from 'react-navigation-header-buttons';

import { CustomIcon } from '../lib/Icons';
import { isIOS } from '../utils/deviceInfo';
import { themes } from '../constants/colors';
import I18n from '../i18n';
import { withTheme } from '../theme';

export const headerIconSize = 23;

const CustomHeaderButton = React.memo(withTheme(({ theme, ...props }) => (
	<HeaderButton
		{...props}
		IconComponent={CustomIcon}
		iconSize={headerIconSize}
		color={themes[theme].headerTintColor}
	/>
)));

export const CustomHeaderButtons = React.memo(props => (
	<HeaderButtons
		HeaderButtonComponent={CustomHeaderButton}
		{...props}
	/>
));

export const DrawerButton = React.memo(({ navigation, testID, ...otherProps }) => (
	<CustomHeaderButtons left>
		<Item title='drawer' iconName='hamburguer' onPress={navigation.toggleDrawer} testID={testID} {...otherProps} />
	</CustomHeaderButtons>
));

export const CloseModalButton = React.memo(({
	navigation, testID, onPress = () => navigation.pop(), ...props
}) => (
	<CustomHeaderButtons left>
		<Item title='close' iconName='close' onPress={onPress} testID={testID} {...props} />
	</CustomHeaderButtons>
));

export const CancelModalButton = React.memo(({ onPress, testID }) => (
	<CustomHeaderButtons left>
		{isIOS
			? <Item title={I18n.t('Cancel')} onPress={onPress} testID={testID} />
			: <Item title='close' iconName='close' onPress={onPress} testID={testID} />
		}
	</CustomHeaderButtons>
));

export const MoreButton = React.memo(({ onPress, testID }) => (
	<CustomHeaderButtons>
		<Item title='more' iconName='kebab' onPress={onPress} testID={testID} />
	</CustomHeaderButtons>
));

export const SaveButton = React.memo(({ onPress, testID, ...props }) => (
	<CustomHeaderButtons>
		<Item title='save' iconName='download' onPress={onPress} testID={testID} {...props} />
	</CustomHeaderButtons>
));

export const PreferencesButton = React.memo(({ onPress, testID, ...props }) => (
	<CustomHeaderButtons>
		<Item title='preferences' iconName='settings' onPress={onPress} testID={testID} {...props} />
	</CustomHeaderButtons>
));

export const LegalButton = React.memo(({ navigation, testID }) => (
	<MoreButton onPress={() => navigation.navigate('LegalView')} testID={testID} />
));

CustomHeaderButton.propTypes = {
	theme: PropTypes.string
};
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

export { Item };
