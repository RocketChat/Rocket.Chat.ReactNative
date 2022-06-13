import React from 'react';
import { FlatList, StyleSheet, Switch } from 'react-native';
import { Observable, Subscription } from 'rxjs';

import { ChatsStackParamList } from '../../stacks/types';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import { SWITCH_TRACK_COLOR, themes } from '../../lib/constants';
import { withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { IBaseScreen, ISubscription } from '../../definitions';
import { Services } from '../../lib/services';

const styles = StyleSheet.create({
	list: {
		paddingTop: 16
	}
});

type TAutoTranslateViewProps = IBaseScreen<ChatsStackParamList, 'AutoTranslateView'>;

class AutoTranslateView extends React.Component<TAutoTranslateViewProps, any> {
	static navigationOptions = () => ({
		title: I18n.t('Auto_Translate')
	});

	private mounted: boolean;
	private rid: string;
	private roomObservable?: Observable<ISubscription>;
	private subscription?: Subscription;

	constructor(props: TAutoTranslateViewProps) {
		super(props);
		this.mounted = false;
		this.rid = props.route.params?.rid ?? '';
		const room = props.route.params?.room;

		if (room && room.observe) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable.subscribe((changes: ISubscription) => {
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
			selectedLanguage: room?.autoTranslateLanguage,
			enableAutoTranslate: room?.autoTranslate
		};
	}

	async componentDidMount() {
		this.mounted = true;
		try {
			const languages = await Services.getSupportedLanguagesAutoTranslate();
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

	toggleAutoTranslate = async () => {
		logEvent(events.AT_TOGGLE_TRANSLATE);
		const { enableAutoTranslate } = this.state;
		try {
			await Services.saveAutoTranslate({
				rid: this.rid,
				field: 'autoTranslate',
				value: enableAutoTranslate ? '0' : '1',
				options: { defaultLanguage: 'en' }
			});
			this.setState({ enableAutoTranslate: !enableAutoTranslate });
		} catch (error) {
			logEvent(events.AT_TOGGLE_TRANSLATE_F);
			console.log(error);
		}
	};

	saveAutoTranslateLanguage = async (language: string) => {
		logEvent(events.AT_SET_LANG);
		try {
			await Services.saveAutoTranslate({
				rid: this.rid,
				field: 'autoTranslateLanguage',
				value: language
			});
			this.setState({ selectedLanguage: language });
		} catch (error) {
			logEvent(events.AT_SET_LANG_F);
			console.log(error);
		}
	};

	renderIcon = () => {
		const { theme } = this.props;
		return <List.Icon name='check' color={themes[theme].tintColor} />;
	};

	renderSwitch = () => {
		const { enableAutoTranslate } = this.state;
		return <Switch value={enableAutoTranslate} trackColor={SWITCH_TRACK_COLOR} onValueChange={this.toggleAutoTranslate} />;
	};

	renderItem = ({ item }: { item: { language: string; name: string } }) => {
		const { selectedLanguage } = this.state;
		const { language, name } = item;
		const isSelected = selectedLanguage === language;

		return (
			<List.Item
				title={name || language}
				onPress={() => this.saveAutoTranslateLanguage(language)}
				testID={`auto-translate-view-${language}`}
				right={() => (isSelected ? this.renderIcon() : null)}
				translateTitle={false}
			/>
		);
	};

	render() {
		const { languages } = this.state;
		return (
			<SafeAreaView testID='auto-translate-view'>
				<StatusBar />
				<List.Container testID='auto-translate-view-list'>
					<List.Section>
						<List.Separator />
						<List.Item title='Enable_Auto_Translate' testID='auto-translate-view-switch' right={() => this.renderSwitch()} />
						<List.Separator />
					</List.Section>
					<FlatList
						data={languages}
						extraData={this.state}
						keyExtractor={item => item.language}
						renderItem={this.renderItem}
						ItemSeparatorComponent={List.Separator}
						ListFooterComponent={List.Separator}
						ListHeaderComponent={List.Separator}
						contentContainerStyle={[List.styles.contentContainerStyleFlatList, styles.list]}
					/>
				</List.Container>
			</SafeAreaView>
		);
	}
}

export default withTheme(AutoTranslateView);
