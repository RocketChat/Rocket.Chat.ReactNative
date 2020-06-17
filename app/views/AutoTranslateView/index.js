import React from 'react';
import PropTypes from 'prop-types';
import {
	FlatList, Switch, View, StyleSheet, ScrollView
} from 'react-native';

import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../Styles';
import ListItem from '../../containers/ListItem';
import Separator from '../../containers/Separator';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';

const styles = StyleSheet.create({
	contentContainerStyle: {
		borderTopWidth: StyleSheet.hairlineWidth,
		marginTop: 10,
		paddingBottom: 30
	},
	flatListContainerStyle: {
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	sectionSeparator: {
		...sharedStyles.separatorVertical,
		height: 10
	}
});

const SectionSeparator = React.memo(({ theme }) => (
	<View
		style={[
			styles.sectionSeparator,
			{
				backgroundColor: themes[theme].auxiliaryBackground,
				borderColor: themes[theme].separatorColor
			}
		]}
	/>
));

SectionSeparator.propTypes = {
	theme: PropTypes.string
};

class AutoTranslateView extends React.Component {
	static navigationOptions = {
		title: I18n.t('Auto_Translate')
	}

	static propTypes = {
		route: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		this.rid = props.route.params?.rid;
		const room = props.route.params?.room;

		if (room && room.observe) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable
				.subscribe((changes) => {
					if (this.mounted) {
						const { selectedLanguage, enableAutoTranslate } = this.state;
						if (selectedLanguage !== changes.autoTranslateLanguage) {
							this.setState({ selectedLanguage: changes.autoTranslateLanguage });
						}
						if (enableAutoTranslate !== changes.autoTranslate) {
							this.setState({ enableAutoTranslate: changes.autoTranslate });
						}
					}
				});
		}
		this.state = {
			languages: [],
			selectedLanguage: room.autoTranslateLanguage,
			enableAutoTranslate: room.autoTranslate
		};
	}

	async componentDidMount() {
		this.mounted = true;
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

	renderSeparator = () => {
		const { theme } = this.props;
		return <Separator theme={theme} />;
	}

	renderIcon = () => {
		const { theme } = this.props;
		return <CustomIcon name='check' size={20} style={{ color: themes[theme].tintColor }} />;
	}

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
		const { theme } = this.props;
		const { language, name } = item;
		const isSelected = selectedLanguage === language;

		return (
			<ListItem
				title={name || language}
				onPress={() => this.saveAutoTranslateLanguage(language)}
				testID={`auto-translate-view-${ language }`}
				right={isSelected ? this.renderIcon : null}
				theme={theme}
			/>
		);
	}

	render() {
		const { languages } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView testID='auto-translate-view' theme={theme}>
				<StatusBar theme={theme} />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={[
						styles.contentContainerStyle,
						{
							backgroundColor: themes[theme].auxiliaryBackground,
							borderColor: themes[theme].separatorColor
						}
					]}
					testID='auto-translate-view-list'
				>
					<ListItem
						title={I18n.t('Enable_Auto_Translate')}
						testID='auto-translate-view-switch'
						right={() => this.renderSwitch()}
						theme={theme}
					/>
					<SectionSeparator theme={theme} />
					<FlatList
						data={languages}
						extraData={this.state}
						keyExtractor={item => item.language}
						renderItem={this.renderItem}
						ItemSeparatorComponent={this.renderSeparator}
						contentContainerStyle={[styles.flatListContainerStyle, { borderColor: themes[theme].separatorColor }]}
					/>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

export default withTheme(AutoTranslateView);
