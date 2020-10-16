import React from 'react';
import PropTypes from 'prop-types';
import { HeaderButton, Item } from 'react-navigation-header-buttons';

import { CustomIcon } from '../../lib/Icons';
import { isIOS } from '../../utils/deviceInfo';
import { themes } from '../../constants/colors';
import I18n from '../../i18n';
import { withTheme } from '../../theme';
import HeaderButtonContainer from './HeaderButtonContainer';
import HeaderButtonItem from './HeaderButtonItem';

export const headerIconSize = 23;

export { HeaderButtonContainer, HeaderButtonItem }

const CustomHeaderButton = React.memo(withTheme(({ theme, ...props }) => (
	<HeaderButton
		{...props}
		IconComponent={CustomIcon}
		iconSize={headerIconSize}
		color={themes[theme].headerTintColor}
	/>
)));

// export const HeaderButtonContainer = React.memo(props => (
// 	<HeaderButtons
// 		HeaderButtonComponent={CustomHeaderButton}
// 		{...props}
// 	/>
// ));

export const DrawerButton = React.memo(({ navigation, testID, ...otherProps }) => (
	<HeaderButtonContainer left>
		<HeaderButtonItem iconName='hamburguer' onPress={navigation.toggleDrawer} testID={testID} {...otherProps} />
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
