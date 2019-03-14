import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, View, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { RectButton } from 'react-native-gesture-handler';

import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import LoggedView from './View';
import I18n from '../i18n';
import DisclosureIndicator from '../containers/DisclosureIndicator';
import { CloseModalButton } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f7f8fa',
		flex: 1
	},
	scroll: {
		marginTop: 35,
		backgroundColor: '#fff',
		borderColor: '#cbced1',
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	separator: {
		backgroundColor: '#cbced1',
		height: StyleSheet.hairlineWidth,
		width: '100%',
		marginLeft: 20
	},
	item: {
		width: '100%',
		height: 48,
		backgroundColor: '#fff',
		paddingLeft: 20,
		paddingRight: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	text: {
		...sharedStyles.textMedium,
		color: '#0c0d0f',
		fontSize: 18
	}
});

const Separator = () => <View style={styles.separator} />;

/** @extends React.Component */
export default class LegalView extends LoggedView {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: <CloseModalButton testID='legal-view-close' navigation={navigation} />,
		title: I18n.t('Legal')
	})

	static propTypes = {
		navigation: PropTypes.object
	}

	constructor(props) {
		super('LegalView', props);
	}

	onPressItem = ({ route }) => {
		const { navigation } = this.props;
		navigation.navigate(route);
	}

	renderItem = ({ text, route, testID }) => (
		<RectButton style={styles.item} onPress={() => this.onPressItem({ route })} testID={testID}>
			<Text style={styles.text}>{I18n.t(text)}</Text>
			<DisclosureIndicator />
		</RectButton>
	)

	render() {
		return (
			<SafeAreaView style={styles.container} testID='legal-view' forceInset={{ bottom: 'never' }}>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.scroll}>
					{this.renderItem({ text: 'Terms_of_Service', route: 'TermsServiceView', testID: 'legal-terms-button' })}
					<Separator />
					{this.renderItem({ text: 'Privacy_Policy', route: 'PrivacyPolicyView', testID: 'legal-privacy-button' })}
				</ScrollView>
			</SafeAreaView>
		);
	}
}
