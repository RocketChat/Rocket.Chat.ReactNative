import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, StyleSheet } from 'react-native';

import I18n from '../i18n';
import { themedHeader } from '../utils/navigation';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import sharedStyles from './Styles';

import ListItem from '../containers/ListItem';
import Check from '../containers/Check';
import Separator from '../containers/Separator';

const styles = StyleSheet.create({
	check: {
		marginHorizontal: 0
	}
});

const Item = React.memo(({
	item,
	selected,
	onItemPress,
	theme
}) => (
	<ListItem
		title={item.label}
		right={selected && (() => <Check theme={theme} style={styles.check} />)}
		onPress={onItemPress}
		theme={theme}
	/>
));
Item.propTypes = {
	item: PropTypes.object,
	selected: PropTypes.bool,
	onItemPress: PropTypes.func,
	theme: PropTypes.string
};

class PickerView extends React.PureComponent {
	static navigationOptions = ({ navigation, screenProps }) => ({
		title: navigation.getParam('title', I18n.t('Select_an_option')),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		const data = props.navigation.getParam('data', []);
		const value = props.navigation.getParam('value');
		this.state = { data, value };
	}

	onChangeValue = (value) => {
		const { navigation } = this.props;
		const onChange = navigation.getParam('onChangeValue', () => {});
		onChange(value);
		navigation.goBack();
	}

	render() {
		const { data, value } = this.state;
		const { theme } = this.props;

		return (
			<FlatList
				data={data}
				keyExtractor={item => item.value}
				renderItem={({ item }) => (
					<Item
						item={item}
						theme={theme}
						selected={(value || data[0]?.value) === item.value}
						onItemPress={() => this.onChangeValue(item.value)}
					/>
				)}
				ItemSeparatorComponent={() => <Separator theme={theme} />}
				contentContainerStyle={[
					sharedStyles.listContentContainer,
					{
						backgroundColor: themes[theme].auxiliaryBackground,
						borderColor: themes[theme].separatorColor
					}
				]}
				style={{ backgroundColor: themes[theme].auxiliaryBackground }}
			/>
		);
	}
}

export default withTheme(PickerView);
