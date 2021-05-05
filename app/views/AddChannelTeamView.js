import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { HeaderBackButton } from '@react-navigation/stack';

import sharedStyles from './Styles';
import { CustomIcon } from '../lib/Icons';
import Touch from '../utils/touch';
import StatusBar from '../containers/StatusBar';
import { withTheme } from '../theme';
import * as HeaderButton from '../containers/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import { withDimensions } from '../dimensions';
import { themes } from '../constants/colors';
import I18n from '../i18n';

const styles = StyleSheet.create({
	button: {
		height: 46,
		flexDirection: 'row',
		alignItems: 'center'
	},
	buttonIcon: {
		marginLeft: 18,
		marginRight: 16
	},
	buttonText: {
		fontSize: 17,
		...sharedStyles.textRegular
	},
	buttonContainer: {
		paddingVertical: 25
	}
});

class AddChannelTeamView extends React.Component {
	constructor(props) {
		super(props);
		this.teamId = props.route.params?.teamId;
		this.setHeader();
	}

	setHeader = () => {
		const { navigation, isMasterDetail, theme } = this.props;

		const options = {
			headerShown: true,
			headerTitleAlign: 'center',
			headerTitle: I18n.t('Add_Channel_to_Team')
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		} else {
			options.headerLeft = () => (
				<HeaderBackButton
					labelVisible={false}
					onPress={() => navigation.pop()}
					tintColor={themes[theme].headerTintColor}
				/>
			);
		}

		navigation.setOptions(options);
	}

	renderButton = ({
		onPress, testID, title, icon, first
	}) => {
		const { theme } = this.props;

		return (
			<Touch
				onPress={onPress}
				style={({ pressed }) => [{
					backgroundColor: pressed ? themes[theme].chatComponentBackground : themes[theme].backgroundColor
				}]}
				testID={testID}
				theme={theme}
			>
				<View style={[first ? sharedStyles.separatorVertical : sharedStyles.separatorBottom, styles.button, { borderColor: themes[theme].separatorColor }]}>
					<CustomIcon style={[styles.buttonIcon, { color: themes[theme].tintColor }]} size={24} name={icon} />
					<Text style={[styles.buttonText, { color: themes[theme].tintColor }]}>{title}</Text>
				</View>
			</Touch>
		);
	}

	render() {
		const { navigation, route } = this.props;
		const { teamChannels } = route?.params;

		return (
			<SafeAreaView testID='add-channel-team-view'>
				<StatusBar />
				<View style={styles.buttonContainer}>
					{this.renderButton({
						onPress: () => navigation.navigate('NewMessageStackNavigator', { screen: 'SelectedUsersViewCreateChannel', params: { nextAction: () => navigation.navigate('CreateChannelView', { teamId: this.teamId }) } }),
						title: I18n.t('Create_New'),
						icon: 'channel-public',
						testID: 'add-channel-team-view-create-channel',
						first: true
					})}
					{this.renderButton({
						onPress: () => navigation.navigate('AddExistingChannelView', { teamId: this.teamId, teamChannels }),
						title: I18n.t('Add_Existing'),
						icon: 'team',
						testID: 'add-channel-team-view-create-channel'
					})}
				</View>
			</SafeAreaView>
		);
	}
}

AddChannelTeamView.propTypes = {
	route: PropTypes.object,
	navigation: PropTypes.object,
	isMasterDetail: PropTypes.bool,
	theme: PropTypes.string
};

export default withDimensions(withTheme(AddChannelTeamView));
