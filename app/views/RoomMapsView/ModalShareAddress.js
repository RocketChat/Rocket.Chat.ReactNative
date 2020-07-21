import React, { Component } from 'react';
import { Text, View, Image } from 'react-native';
import PropTypes from 'prop-types';
import Modal, {
	ModalTitle,
	ModalContent,
	ModalFooter,
	ModalButton
} from 'react-native-modals';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import GeolocationIcon from './GeolocationIcon';
import CurrentAccuracy from './CurrentAccuracy';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import styles from './styles';

class ModalShareAddress extends Component {
	static propTypes = {
		isVisible: PropTypes.bool,
		title: PropTypes.string,
		theme: PropTypes.string,
		onTouchOutside: PropTypes.func,
		onPressCancel: PropTypes.func,
		onPressShareLocation: PropTypes.func,
		accuracy: PropTypes.number,
		iconAddress: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {

		};
	}

	renderIcon = () => {
		const { iconAddress, theme } = this.props;
		if (iconAddress === 'locationDrag') {
			return (
				<View style={[styles.imageIconView, { backgroundColor: 'rgba(93, 188, 210, 0.25)' }]}>
					<MaterialIcons name='location-on' size={30} color={themes[theme].bodyText} />
				</View>
			);
		} else if (iconAddress === 'myLocation') {
			return (
				<GeolocationIcon
					theme={theme}
					WIDTH_HEIGHT_CONTAINER={15}
					RADIUS_CONTAINER={9}
					WIDTH_HEIGHT_SUB={10}
					RADIUS_SUB={5}
				/>
			);
		} else {
			return (
				<View style={styles.imageIconView}>
					<Image resizeMode='contain' source={{ uri: iconAddress }} style={styles.iconAddress} />
				</View>
			);
		}
	}

	render() {
		const {
			isVisible,
			theme,
			title,
			onTouchOutside,
			onPressCancel,
			accuracy,
			onPressShareLocation
		} = this.props;
		return (
			<Modal
				width={0.9}
				rounded
				actionsBordered
				visible={isVisible}
				onTouchOutside={onTouchOutside}
				modalTitle={<ModalTitle textStyle={{ color: themes[theme].bodyText }} style={{ backgroundColor: themes[theme].backgroundColor }} title={I18n.t('Share_Location_Confirm')} align='left' />}
				footer={
					(
						<ModalFooter style={{ backgroundColor: themes[theme].backgroundColor }}>
							<ModalButton
								text={I18n.t('Review_app_no')}
								bordered
								onPress={onPressCancel}
								key='button-1'
							/>
							<ModalButton
								text={I18n.t('Confirm_Yes')}
								bordered
								onPress={onPressShareLocation}
								key='button-2'
							/>
						</ModalFooter>
					)
				}
			>
				<ModalContent style={{ backgroundColor: themes[theme].backgroundColor }}>
					<View style={{ flexDirection: 'row' }}>
						<View style={styles.currentLocationLeft}>
							{this.renderIcon()}
						</View>
						<View style={styles.currentLocationContent}>
							<CurrentAccuracy accuracy={accuracy} theme={theme} />
						</View>
					</View>
					<Text
						numberOfLines={2}
						style={{ color: themes[theme].bodyText, ...styles.textShareRoom }}
					>{I18n.t('Send_Location_Question')} {title} ?
					</Text>
				</ModalContent>
			</Modal>
		);
	}
}

export default ModalShareAddress;
