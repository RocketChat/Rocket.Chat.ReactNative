import React from 'react';
import {
	Text, View, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { COLOR_PRIMARY } from '../../../constants/colors';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	button: {
		flexDirection: 'row'
	},
	title: {
		fontSize: 14,
		...sharedStyles.textColorTitle,
		...sharedStyles.textRegular
	},
	server: {
		fontSize: 12,
		color: COLOR_PRIMARY,
		...sharedStyles.textRegular
	}
});

const HeaderTitle = React.memo(({ connecting, isFetching }) => {
	let title = I18n.t('Messages');
	if (connecting) {
		title = I18n.t('Connecting');
	}
	if (isFetching) {
		title = I18n.t('Updating');
	}
	return <Text style={styles.title}>{title}</Text>;
});

const Header = React.memo(({
	connecting, isFetching, serverName
}) => (
	<View style={styles.container}>
		<HeaderTitle connecting={connecting} isFetching={isFetching} />
		<View style={styles.button}>
			<Text style={styles.server}>{serverName}</Text>
		</View>
	</View>
));

Header.propTypes = {
	connecting: PropTypes.bool,
	isFetching: PropTypes.bool,
	serverName: PropTypes.string
};

Header.defaultProps = {
	serverName: 'Rocket.Chat'
};

HeaderTitle.propTypes = {
	connecting: PropTypes.bool,
	isFetching: PropTypes.bool
};

export default Header;
