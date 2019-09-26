import React from 'react';
import PropTypes from 'prop-types';
import {
	FlatList, Switch, View, StyleSheet
} from 'react-native';
import { ScrollView } from 'react-navigation';
import SafeAreaView from 'react-native-safe-area-view';

import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
// import log from '../../utils/log';
import StatusBar from '../../containers/StatusBar';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../Styles';
import ListItem from '../../containers/ListItem';
import Separator from '../../containers/Separator';
import {
	SWITCH_TRACK_COLOR, COLOR_BACKGROUND_CONTAINER, COLOR_WHITE, COLOR_SEPARATOR
} from '../../constants/colors';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

const styles = StyleSheet.create({
	contentContainerStyle: {
		borderColor: COLOR_SEPARATOR,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_WHITE,
		marginTop: 10,
		paddingBottom: 30
	},
	sectionSeparator: {
		...sharedStyles.separatorVertical,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		height: 10
	}
});

const SectionSeparator = React.memo(() => <View style={styles.sectionSeparator} />);

export default class AutoTranslateView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Auto_Translate')
	})

	static propTypes = {
		navigation: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.rid = props.navigation.getParam('rid');
		const room = props.navigation.getParam('room');

		if (room && room.observe) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable
				.subscribe((changes) => {
					this.room = changes;
				});
		}
		this.state = {
			languages: [],
			selectedLanguage: room.autoTranslateLanguage,
			enableAutoTranslate: room.autoTranslate
		};
	}

	async componentDidMount() {
		try {
			const languages = await RocketChat.getSupportedLanguagesAutoTranslate();
			this.setState({ languages });
		} catch (error) {
			console.log(error);
		}
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	toggleAutoTranslate = async() => {
		const { enableAutoTranslate } = this.state;
		try {
			await RocketChat.saveAutoTranslate({
				rid: this.rid,
				field: 'autoTranslate',
				value: enableAutoTranslate ? '0' : '1',
				options: { defaultLanguage: 'en' }
			});
			this.setState({ enableAutoTranslate: !enableAutoTranslate });
		} catch (error) {
			console.log(error);
		}
	}

	saveAutoTranslateLanguage = async(language) => {
		try {
			await RocketChat.saveAutoTranslate({
				rid: this.rid,
				field: 'autoTranslateLanguage',
				value: language
			});
			this.setState({ selectedLanguage: language });
		} catch (error) {
			console.log(error);
		}
	}

	renderSeparator = () => <Separator />

	renderIcon = () => <CustomIcon name='check' size={20} style={sharedStyles.colorPrimary} />

	renderSwitch = () => {
		const { enableAutoTranslate } = this.state;
		return (
			<Switch
				value={enableAutoTranslate}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleAutoTranslate}
			/>
		);
	}

	renderItem = ({ item }) => {
		const { selectedLanguage } = this.state;
		const { language, name } = item;
		const isSelected = selectedLanguage === language;

		return (
			<ListItem
				title={name || language}
				onPress={() => this.saveAutoTranslateLanguage(language)}
				testID={`auto-translate-view-${ language }`}
				right={isSelected ? this.renderIcon : null}
			/>
		);
	}

	render() {
		const { languages } = this.state;
		return (
			<SafeAreaView style={sharedStyles.listSafeArea} testID='auto-translate-view' forceInset={{ vertical: 'never' }}>
				<StatusBar />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={styles.contentContainerStyle}
					testID='auto-translate-view-list'
				>
					<ListItem
						title={I18n.t('Enable_Auto_Translate')}
						testID='auto-translate-view-switch'
						right={() => this.renderSwitch()}
					/>
					<SectionSeparator />
					<FlatList
						data={languages}
						extraData={this.state}
						keyExtractor={item => item.language}
						renderItem={this.renderItem}
						ItemSeparatorComponent={this.renderSeparator}
					/>
				</ScrollView>
			</SafeAreaView>
		);
	}
}
