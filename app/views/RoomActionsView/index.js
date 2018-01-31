import React from 'react';
import { View, Platform, SectionList, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import styles from './styles';
import Avatar from '../../containers/Avatar';
import Touch from '../../utils/touch';

export default class extends React.Component {
	static navigationOptions = () => ({
		title: 'Actions',
		headerRight: (
			<Touch
				style={styles.headerButton}
				// onPress={() => this.props.navigation.navigate('RoomActions')}
				accessibilityLabel='Star room'
				accessibilityTraits='button'
			>
				<Icon
					name={Platform.OS === 'ios' ? 'ios-star' : 'md-star'}
					// name={Platform.OS === 'ios' ? 'ios-star-outline' : 'md-star-outline'}
					color='#292E35'
					size={24}
					backgroundColor='transparent'
				/>
			</Touch>
		)
	});

	constructor(props) {
		super(props);
		this.sections = [{
			data: [{ icon: 'ios-star', name: 'USER' }],
			renderItem: this.renderRoomInfo
		}, {
			data: [
				{ icon: 'ios-call-outline', name: 'Voicecall' },
				{ icon: 'ios-videocam-outline', name: 'Video call' }
			],
			renderItem: this.renderItem
		}, {
			data: [
				{ icon: 'ios-attach', name: 'Files' },
				{ icon: 'ios-at-outline', name: 'Mentions' },
				{ icon: 'ios-star-outline', name: 'Starred' },
				{ icon: 'ios-search', name: 'Search' },
				{ icon: 'ios-share-outline', name: 'Share' },
				{ icon: 'ios-pin', name: 'Pinned' },
				{ icon: 'ios-code', name: 'Snippets' },
				{ icon: 'ios-notifications-outline', name: 'Notifications preferences' }
			],
			renderItem: this.renderItem
		}, {
			data: [
				{ icon: 'ios-volume-off', name: 'Mute user' },
				{ icon: 'block', name: 'Block user', type: 'danger' },
			],
			renderItem: this.renderItem
		}];
	}

	renderRoomInfo = () => (
		<View style={styles.sectionItem}>
			<Avatar
				text={'d0711'}
				size={50}
				style={styles.avatar}
				baseUrl='https://open.rocket.chat' // {this.props.baseUrl}
				type={'d'}
			/>
			<View style={styles.roomTitleContainer}>
				<Text style={styles.roomTitle}>ASIDHASIUDHASUDIH</Text>
				<Text style={styles.roomDescription}>@ASIDHASIUDHASUDIH</Text>				
			</View>
			<Icon name='ios-arrow-forward' size={20} style={styles.sectionItemIcon} color='#cbced1' />			
		</View>
	)

	renderTouchableItem = (subview, item) => (
		<Touch
			onPress={() => {}}
			underlayColor='#FFFFFF'
			activeOpacity={0.5}
			accessibilityLabel={item.name}
			accessibilityTraits='button'
		>
			<View style={styles.sectionItem}>
				{subview}
			</View>
		</Touch>
	)

	renderItem = ({ item }) => {
		if (item.type === 'danger') {
			const subview = [
				<MaterialIcon key='icon' name={item.icon} size={20} style={[styles.sectionItemIcon, styles.textColorDanger]} />,
				<Text key='name' style={[styles.sectionItemName, styles.textColorDanger]}>{ item.name }</Text>
			];
			return this.renderTouchableItem(subview, item);
		}
		const subview = [
			<Icon key='icon' name={item.icon} size={24} style={styles.sectionItemIcon} />,
			<Text key='name' style={styles.sectionItemName}>{ item.name }</Text>,
			<Icon key='right-icon' name='ios-arrow-forward' size={20} style={styles.sectionItemIcon} color='#cbced1' />
		];
		return this.renderTouchableItem(subview, item);
	}

	renderSectionSeparator = (data) => {
		if (!data.trailingItem) {
			if (!data.trailingSection) {
				return <View style={styles.sectionSeparatorBorder} />;
			}
			return null;
		}
		return (
			<View style={[styles.sectionSeparator, data.leadingSection && styles.sectionSeparatorBorder]} />
		);
	}

	render() {
		return (
			<SectionList
				style={styles.container}
				stickySectionHeadersEnabled={false}
				sections={this.sections}
				SectionSeparatorComponent={this.renderSectionSeparator}
				keyExtractor={(item, index) => index}
			/>
		);
	}
}
