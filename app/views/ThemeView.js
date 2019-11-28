import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import RNUserDefaults from 'rn-user-defaults';

import I18n from '../i18n';
import { themedHeader } from '../utils/navigation';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import sharedStyles from './Styles';
import StatusBar from '../containers/StatusBar';
import Separator from '../containers/Separator';
import ListItem from '../containers/ListItem';
import { CustomIcon } from '../lib/Icons';
import { THEME_KEY } from '../lib/rocketchat';

const THEMES = [
	{
		label: I18n.t('Light'),
		value: 'light'
	}, {
		label: I18n.t('Dark'),
		value: 'dark'
	}, {
		label: I18n.t('Black'),
		value: 'black'
	}
];

class LanguageView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Theme'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		theme: PropTypes.string,
		setTheme: PropTypes.func
	}

	setTheme = (value) => {
		const { setTheme } = this.props;
		setTheme(value);
		// no await, because this causes a delay
		RNUserDefaults.set(THEME_KEY, value);
	};

	renderSeparator = () => {
		const { theme } = this.props;
		return <Separator theme={theme} />;
	}

	renderIcon = () => {
		const { theme } = this.props;
		return <CustomIcon name='check' size={20} style={{ color: themes[theme].tintColor }} />;
	}

	renderItem = ({ item, index }) => {
		const { theme } = this.props;
		const { label, value } = item;
		const isSelected = theme === value;
		return (
			<>
				{index === 0 ? this.renderSeparator() : null}
				<ListItem
					title={label}
					onPress={() => this.setTheme(value)}
					testID={`theme-view-${ value }`}
					right={isSelected ? this.renderIcon : null}
					theme={theme}
				/>
			</>
		);
	}

	renderHeader = () => {
		const { theme } = this.props;
		return (
			<View style={{ paddingBottom: 10, paddingHorizontal: 16 }}>
				<Text style={{ color: themes[theme].auxiliaryText }}>{I18n.t('ALL_THEMES')}</Text>
			</View>
		);
	}

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView
				style={[sharedStyles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
				forceInset={{ vertical: 'never' }}
				testID='language-view'
			>
				<StatusBar theme={theme} />
				<FlatList
					data={THEMES}
					keyExtractor={item => item.value}
					contentContainerStyle={[
						sharedStyles.listContentContainer,
						{
							borderColor: themes[theme].separatorColor,
							borderTopWidth: 0
						}
					]}
					renderItem={this.renderItem}
					ListHeaderComponent={this.renderHeader}
					ItemSeparatorComponent={this.renderSeparator}
				/>
			</SafeAreaView>
		);
	}
}

export default withTheme(LanguageView);
