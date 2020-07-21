import React, { Component } from 'react';
import {
	Text,
	View,
	Dimensions,
	FlatList,
	TouchableOpacity,
	Image,
	ScrollView,
	ActivityIndicator
} from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';
import PropTypes from 'prop-types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import CurrentAccuracy from './CurrentAccuracy';
import GeolocationIcon from './GeolocationIcon';
import ModalShareAddress from './ModalShareAddress';
import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import styles from './styles';

const { height: HEIGHT_WINDOW } = Dimensions.get('window');
const ACTIVE_OPACITY = 0.5;

export default class BottomSheetMaps extends Component {
	static propTypes = {
		nearbySearchResult: PropTypes.array,
		theme: PropTypes.string,
		loadPageAddressNearby: PropTypes.func,
		accuracy: PropTypes.number,
		regionChangeProgress: PropTypes.bool,
		userLocation: PropTypes.object,
		currentRegion: PropTypes.object,
		title: PropTypes.string,
		tmid: PropTypes.string,
		rid: PropTypes.string,
		user: PropTypes.object,
		server: PropTypes.string,
		navigation: PropTypes.object,
		isNetworkRequest: PropTypes.bool,
		onPressRefreshAddress: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props);
		this.sheetRef = null;
		this.scrollView = null;
		this.state = {
			scrollEnabled: false,
			isOpenBottomShete: false,
			isVisible: false,
			regigon: null,
			iconAddress: ''
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			scrollEnabled, isOpenBottomShete, isVisible, iconAddress
		} = this.state;
		const {
			nearbySearchResult, theme, accuracy, userLocation, regionChangeProgress, currentRegion, title, server, isNetworkRequest
		} = this.props;
		if (nextState.scrollEnabled !== scrollEnabled) {
			return true;
		}
		if (nextState.isOpenBottomShete !== isOpenBottomShete) {
			return true;
		}
		if (nextState.iconAddress !== iconAddress) {
			return true;
		}
		if (nextState.isVisible !== isVisible) {
			return true;
		}
		if (nextProps.nearbySearchResult !== nearbySearchResult) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextProps.accuracy !== accuracy) {
			return true;
		}
		if (nextProps.userLocation !== userLocation) {
			return true;
		}
		if (nextProps.regionChangeProgress !== regionChangeProgress) {
			return true;
		}
		if (nextProps.currentRegion !== currentRegion) {
			return true;
		}
		if (nextProps.title !== title) {
			return true;
		}
		if (nextProps.server !== server) {
			return true;
		}
		if (nextProps.isNetworkRequest !== isNetworkRequest) {
			return true;
		}
		return false;
	}

	onCloseEnd = () => {
		this.setState({ isOpenBottomShete: false });
		this.scrollView.scrollTo({ y: 0, animated: true });
	}

	onCloseStart = () => {
		this.setState({ scrollEnabled: false });
		this.scrollView.scrollTo({ y: 0, animated: true });
	}

	sendChooseLocation = () => {
		const { userLocation } = this.props;
		// eslint-disable-next-line prefer-destructuring
		const geometry = (userLocation || {}).geometry;
		// eslint-disable-next-line prefer-destructuring
		const location = (geometry || {}).location;
		if ((location || {}).lat && (location || {}).lng) {
			this.setState({
				isVisible: true,
				regigon: {
					latitude: location.lat,
					longitude: location.lng
				},
				iconAddress: 'locationDrag'
			});
		}
		return null;
	}

	sendCurrentLocation = () => {
		const { currentRegion } = this.props;
		const { latitude, longitude } = currentRegion;
		if (latitude && longitude) {
			this.setState({
				isVisible: true,
				regigon: {
					latitude,
					longitude
				},
				iconAddress: 'myLocation'
			});
		}
	}

	sendAddressNearBySearch = (item) => {
		const { lat: latitude, lng: longitude } = (item.geometry || {}).location;
		if (latitude && longitude) {
			this.setState({
				isVisible: true,
				regigon: {
					latitude,
					longitude
				},
				iconAddress: item.icon
			});
		}
	}

	onPressShareLocation = () => {
		const { regigon } = this.state;
		const {
			tmid,
			rid,
			user,
			navigation
		} = this.props;
		this.setState({
			isVisible: false
		}, async() => {
            // TODO: Send message location
			const location = {
				type: 'Point',
				coordinates: [regigon.longitude, regigon.latitude]
			};
            navigation.goBack();
            return location;
		});
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <View style={[sharedStyles.separator, styles.separator, { backgroundColor: themes[theme].separatorColor }]} />;
	}

	renderAddressNotFound = () => {
		const {
			onPressRefreshAddress,
			theme,
			isNetworkRequest,
			nearbySearchResult
		} = this.props;
		return (
			<View style={styles.refreshView}>
				{!isNetworkRequest && nearbySearchResult.length === 0 ? (
					<>
						<Text style={[styles.alertNotFoundAddress, { color: themes[theme].bodyText }]}>{I18n.t('No_Location_Near_You')}</Text>
						<TouchableOpacity
							activeOpacity={ACTIVE_OPACITY}
							onPress={onPressRefreshAddress}
							style={[styles.buttonRefreshAddress]}
						>
							<Text style={styles.txtRefresh}>{I18n.t('Retry')}</Text>
						</TouchableOpacity>
					</>
				)
					: (
						<View style={{ flexDirection: 'row' }}>
							<ActivityIndicator size='small' color={themes[theme].auxiliaryText} />
							<Text style={[styles.alertNotFoundAddress, { color: themes[theme].bodyText, marginLeft: 5 }]}>{I18n.t('Search_Location_Near_You')}</Text>
						</View>
					)
				}
			</View>
		);
	}

	renderItem = ({ item }) => {
		const { theme } = this.props;
		return (
			<TouchableOpacity style={styles.buttonAddress} activeOpacity={ACTIVE_OPACITY} onPress={() => this.sendAddressNearBySearch(item)}>
				<View style={styles.imageIconView}>
					<Image resizeMode='contain' source={{ uri: item.icon }} style={styles.iconAddress} />
				</View>
				<View style={styles.addressView}>
					<Text style={{ color: themes[theme].bodyText, fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
					<Text style={{ color: themes[theme].bodyText, fontSize: 12 }}>{item.vicinity}</Text>
				</View>
			</TouchableOpacity>
		);
	}

	renderHeaderSheet = () => {
		const { theme } = this.props;
		return (
			<View style={styles.headerSheet}>
				<View style={[styles.sheetTouchHeader, { backgroundColor: themes[theme].headerBackground }]} />
			</View>
		);
	}

	renderContent = () => {
		const {
			nearbySearchResult,
			theme,
			loadPageAddressNearby,
			regionChangeProgress,
			userLocation,
			isNetworkRequest,
			accuracy
		} = this.props;
		const {
			isOpenBottomShete, scrollEnabled
		} = this.state;
		return (
			<View style={[styles.content, { backgroundColor: themes[theme].backgroundColor }]}>
				<ScrollView
					nestedScrollEnabled={false}
					scrollEnabled={scrollEnabled}
					ref={ref => (this.scrollView = ref)}
				>
					<View style={[styles.currentLocation, { backgroundColor: themes[theme].backgroundColor }]}>
						<TouchableOpacity style={styles.buttonAddress} activeOpacity={ACTIVE_OPACITY} onPress={this.sendChooseLocation}>
							<View style={[styles.imageIconView, { backgroundColor: 'rgba(93, 188, 210, 0.25)' }]}>
								<MaterialIcons name='location-on' size={30} color={themes[theme].bodyText} />
							</View>
							<View style={styles.addressView}>
								<Text
									style={{ color: themes[theme].bodyText, fontWeight: 'bold' }}
								>{I18n.t('Location_Choose_In_Maps')}
								</Text>
								<Text
									style={{ color: themes[theme].bodyText, ...styles.text }}
									numberOfLines={1}
								>
									{!regionChangeProgress ? (userLocation || {}).formatted_address : I18n.t('Identifying_Location')}
								</Text>
							</View>

						</TouchableOpacity>

						{this.renderSeparator()}

						<TouchableOpacity style={styles.buttonAddress} activeOpacity={ACTIVE_OPACITY} onPress={this.sendCurrentLocation}>

							<View style={[styles.imageIconView, { backgroundColor: 'rgba(93, 188, 210, 0.25)' }]}>
								<GeolocationIcon
									theme={theme}
									WIDTH_HEIGHT_CONTAINER={18}
									RADIUS_CONTAINER={9}
									WIDTH_HEIGHT_SUB={13}
									RADIUS_SUB={8}
								/>
							</View>

							<View style={styles.addressView}>
								<CurrentAccuracy accuracy={accuracy} theme={theme} />
							</View>

						</TouchableOpacity>
					</View>

					<View style={[styles.placeNearByView, { backgroundColor: themes[theme].backgroundColor }]}>
						<Text style={[styles.textPlaceNearByYou, { color: themes[theme].bodyText }]}>{isOpenBottomShete ? I18n.t('Send_Place_Near_You') : I18n.t('Pull_Up_To_See_More_Location')}</Text>
					</View>

					{
						!isNetworkRequest && nearbySearchResult.length > 0 ? (
							<FlatList
								data={nearbySearchResult}
								extraData={this.state}
								keyExtractor={item => item._id}
								renderItem={this.renderItem}
								ItemSeparatorComponent={this.renderSeparator}
								contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
								onEndReached={loadPageAddressNearby}
								style={{ marginBottom: 10 }}
							/>
						) : (
							<>{this.renderAddressNotFound()}</>
						)
					}
				</ScrollView>
			</View>
		);
	};

	render() {
		const {
			scrollEnabled,
			isVisible,
			iconAddress
		} = this.state;
		const { theme, title, accuracy } = this.props;
		return (
			<>
				<BottomSheet
					ref={ref => (this.sheetRef = ref)}
					enabledContentGestureInteraction={!scrollEnabled}
					renderContent={this.renderContent}
					renderHeader={() => this.renderHeaderSheet()}
					onCloseStart={this.onCloseStart}
					onCloseEnd={this.onCloseEnd}
					onOpenStart={() => this.setState({ isOpenBottomShete: true })}
					onOpenEnd={() => this.setState({ scrollEnabled: true })}
					enabledGestureInteraction
					enabledHeaderGestureInteraction
					enabledContentTapInteraction={scrollEnabled}
					enabledManualSnapping
					enabledBottomClamp
					initialSnap={1}
					snapPoints={[HEIGHT_WINDOW - 200, HEIGHT_WINDOW / 4, HEIGHT_WINDOW / 2]}
				/>
				<ModalShareAddress
					isVisible={isVisible}
					theme={theme}
					title={title}
					accuracy={accuracy}
					iconAddress={iconAddress}
					onPressShareLocation={this.onPressShareLocation}
					onTouchOutside={() => {
						this.setState({ isVisible: false });
					}}
					onPressCancel={() => {
						this.setState({
							isVisible: false,
							regigon: null
						});
					}}
				/>
			</>
		);
	}
}
