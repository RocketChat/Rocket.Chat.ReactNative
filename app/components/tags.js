import { StyleSheet, TouchableHighlight, Text, View, TextInput, FlatList } from 'react-native';
import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Ionicons';
import Avatar from './avatar';

const styles = StyleSheet.create({
	result: {
		marginTop: 15,
		padding: 16,
		borderWidth: 1,
		flexGrow: 1,
		flexShrink: 1,
		borderColor: '#e1e5e8'
	},
	result_item: {
		paddingVertical: 8,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	container: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'flex-start',
		width: '100%',
		borderWidth: 2,
		padding: 4,
		paddingRight: 8,
		borderColor: '#e1e5e8'

	},
	tag: {
		color: '#2f343d',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 5,
		flexShrink: 1
	},
	iconContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		width: 25,
		height: 25,
		marginRight: 5
	},
	avatarInitials: {
		color: 'white'
	},
	input: {
		height: 45,
		paddingLeft: 10,
		flexGrow: 1,
		backgroundColor: 'white',
		color: 'black',
		minWidth: 150
	},
	containerTag: {
		backgroundColor: '#f2f3f5',
		// justifyContent: 'center',
		alignItems: 'center',
		marginHorizontal: 2,
		marginBottom: 5,
		borderRadius: 2,
		padding: 8,
		margin: 2,
		// flex: 1,
		// flexGrow: 0,
		maxWidth: '100%',
		flexShrink: 1,
		flexDirection: 'row'
	}
});

const renderTag = (item, index) => (<Item key={item} label={item} onPress={() => this.props.onPress(item, index)} />);

const renderItemResult = ({ item = '' }) => (
	<View style={styles.result_item}>
		<Avatar	text={item}	width={40}	height={40} fontSize={20} style={{ marginRight: 5 }}	/>
		<Text>@{item}</Text>
	</View>);

export default class tags extends React.PureComponent {
	static propTypes = {
		values: PropTypes.array.isRequired,
		// onPress: PropTypes.func.isRequired,
		placeholder: PropTypes.string.isRequired,
		renderItemResult: PropTypes.func,
		renderTag: PropTypes.func,
		onChangeText: PropTypes.func.isRequired
	}
	render() {
		return (
			<View style={{ flex: 1 }}>
				<View style={styles.container}>
					{this.props.values.map(this.props.renderTag || renderTag)}
					<TextInput
						style={styles.input}
						placeholder={this.props.placeholder}
						autoCorrect={false}
						autoCapitalize='none'
						onChangeText={this.props.onChangeText}
					/>
				</View>
				{this.props.result ? <FlatList
					keyExtractor={item => item}
					style={styles.result}
					data={this.props.result || []}
					renderItem={this.props.renderItemResult || renderItemResult}
				/> : null}
			</View>);
	}
}

const Item = ({ onPress, label }) => (<TouchableHighlight onPress={onPress}>
	<View style={styles.containerTag}>
		<Avatar text={label} style={{ marginRight: 5 }} />
		<Text llipsizeMode='tail' numberOfLines={1} style={styles.tag}>{label}</Text><Icon size={18} color={'#9d9fa3'} name='md-close' style={styles.close} />
	</View>
</TouchableHighlight>);

Item.propTypes = {
	label: PropTypes.string.isRequired,
	onPress: PropTypes.func.isRequired
};
