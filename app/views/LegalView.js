import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, View, StyleSheet, Image
} from 'react-native';
import SafeAreaView from 'react-native-safe-area-view';
import { RectButton } from 'react-native-gesture-handler';

import Navigation from '../lib/Navigation';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import { isIOS, isAndroid } from '../utils/deviceInfo';
import LoggedView from './View';
import I18n from '../i18n';
import { DARK_HEADER } from '../constants/headerOptions';
import Icons from '../lib/Icons';

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
	},
	disclosureIndicator: {
		width: 20,
		height: 20
	}
});

const Separator = () => <View style={styles.separator} />;

/** @extends React.Component */
export default class LegalView extends LoggedView {
	static options() {
		return {
			...DARK_HEADER,
			topBar: {
				...DARK_HEADER.topBar,
				title: {
					...DARK_HEADER.topBar.title,
					text: I18n.t('Legal')
				},
				leftButtons: [{
					id: 'close',
					icon: isAndroid ? Icons.getSource('back') : undefined,
					text: isIOS ? I18n.t('Close') : undefined,
					testID: 'legal-view-close'
				}]
			}
		};
	}

	static propTypes = {
		componentId: PropTypes.string
	}

	constructor(props) {
		super('LegalView', props);
		Navigation.events().bindComponent(this);
	}

	navigationButtonPressed = ({ buttonId }) => {
		if (buttonId === 'close') {
			const { componentId } = this.props;
			Navigation.dismissModal(componentId);
		}
	}

	onPressItem = ({ route }) => {
		const { componentId } = this.props;
		Navigation.push(componentId, {
			component: {
				name: route
			}
		});
	}

	renderItem = ({ text, route, testID }) => (
		<RectButton style={styles.item} onPress={() => this.onPressItem({ route })} testID={testID}>
			<Text style={styles.text}>{I18n.t(text)}</Text>
			<Image source={{ uri: 'disclosure_indicator' }} style={styles.disclosureIndicator} />
		</RectButton>
	)

	render() {
		return (
			<SafeAreaView style={styles.container} testID='legal-view' forceInset={{ bottom: 'never' }}>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.scroll}>
					{this.renderItem({ text: 'Terms_of_Service', route: 'TermsServiceView', testID: 'legal-terms-button' })}
					<Separator />
					{this.renderItem({ text: 'Privacy_Policy', route: 'PrivacyPolicyView', testID: 'legal-privacy-button' })}
				</ScrollView>
			</SafeAreaView>
		);
	}
}
