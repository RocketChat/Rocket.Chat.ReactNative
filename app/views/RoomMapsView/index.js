/* eslint-disable react/sort-comp */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View,
	TouchableOpacity,
	DeviceEventEmitter,
	Platform,
	Dimensions,
	Text
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { connect } from 'react-redux';
import RNSettings from 'react-native-settings';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import SafeAreaView from '../../containers/SafeAreaView';
import BottomSheetMaps from './BottomSheetMaps';
import { customMapStyle } from './MapStyles';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import { showConfirmationAlert } from '../../utils/info';
import debounce from '../../utils/debounce';
import { withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import styles from './styles';
// import StatusBar from '../../containers/StatusBar';
import { CloseModalButton } from '../../containers/HeaderButton';

const screen = Dimensions.get('window');

const ASPECT_RATIO = screen.width / screen.height;

const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const RADIUS = 5000;

class ShareLocation extends Component {
	static propTypes = {
		theme: PropTypes.string,
		MapView_GMapsAPIKey: PropTypes.string,
		navigation: PropTypes.object,
		route: PropTypes.object,
		server: PropTypes.string,
		user: PropTypes.object
	}

	static navigationOptions = () => ({
		header: null
	});

	constructor(props) {
		super(props);
		this._mapView = null;
		this.watchID = null;
		this.state = {
			isNetworkRequest: false,
			mapRegion: null,
			latitude: null,
			longitude: null,
			currentRegion: null,
			userLocation: null,
			nearbySearchResult: [],
			regionChangeProgress: false,
			pagetoken: '',
			accuracy: 0
		};
	}

	componentDidMount() {
		DeviceEventEmitter.addListener(
			RNSettings.GPS_PROVIDER_EVENT,
			this.handleGPSProviderEvent
		);
		Geolocation.getCurrentPosition(
			(position) => {
				const region = {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
					latitudeDelta: LATITUDE_DELTA,
					longitudeDelta: LONGITUDE_DELTA
				};
				this.onRegionChangeComplete(region, region.latitude, region.longitude);
				this.setState(
					{
						mapRegion: region,
						currentRegion: region,
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						accuracy: position.coords.accuracy
					},
					() => {
						this.getNearBySearch();
					}
				);
			},
			// error => Alert.alert('Error', JSON.stringify(error)),
			{ enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 }
		);
		this.watchID = Geolocation.watchPosition((position) => {
			const region = {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				latitudeDelta: LATITUDE_DELTA,
				longitudeDelta: LONGITUDE_DELTA
			};
			this.setState({
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				currentRegion: region,
				accuracy: position.coords.accuracy
			}, () => this.getNearBySearch());
			this.onRegionChangeComplete(region, region.latitude, region.longitude);
		});
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { theme, server } = this.props;
		const {
			mapRegion,
			latitude,
			longitude,
			currentRegion,
			userLocation,
			nearbySearchResult,
			regionChangeProgress,
			pagetoken,
			accuracy,
			isNetworkRequest
		} = this.state;
		if (nextState.mapRegion !== mapRegion) {
			return true;
		}
		if (nextState.isNetworkRequest !== isNetworkRequest) {
			return true;
		}
		if (nextState.accuracy !== accuracy) {
			return true;
		}
		if (nextState.latitude !== latitude) {
			return true;
		}
		if (nextState.longitude !== longitude) {
			return true;
		}
		if (nextState.pagetoken !== pagetoken) {
			return true;
		}
		if (nextState.currentRegion !== currentRegion) {
			return true;
		}
		if (nextState.userLocation !== userLocation) {
			return true;
		}
		if (nextState.nearbySearchResult !== nearbySearchResult) {
			return true;
		}
		if (nextState.regionChangeProgress !== regionChangeProgress) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextProps.server !== server) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		this.watchID !== null && Geolocation.clearWatch(this.watchID);
	}

	onPressRefreshAddress = () => {
		this.setState({
			isNetworkRequest: true
		}, async() => {
			await this.getNearBySearch();
			setTimeout(() => {
				this.setState({
					isNetworkRequest: false
				});
			}, 1500);
		});
	};

	setCurrentUser = ({ coordinate }) => {
		this.setState({
			currentRegion: {
				latitude: coordinate.latitude,
				longitude: coordinate.longitude,
				longitudeDelta: LONGITUDE_DELTA,
				latitudeDelta: LATITUDE_DELTA
			},
			accuracy: coordinate.accuracy
		});
	}

	getNearBySearch = debounce(async() => {
		// eslint-disable-next-line no-useless-catch
		try {
			const { latitude, longitude, pagetoken } = this.state;
			const { MapView_GMapsAPIKey } = this.props;
			// const nextPageToken = pagetoken ? `&pagetoken=${ pagetoken }` : '';
			const URL = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${ latitude },${ longitude }&types=bar||cafe&radius=${ RADIUS }&key=${ MapView_GMapsAPIKey }`;
			const response = await fetch(URL);
			const responseJson = await response.json();
			this.setState({
				nearbySearchResult: responseJson.results,
				pagetoken: responseJson.next_page_token,
				// isNetworkRequest: false
			});
			return responseJson;
		} catch (error) {
			throw error;
		}
	});

	fetchAddress = async() => {
		// eslint-disable-next-line no-useless-catch
		try {
			const { mapRegion } = this.state;
			const { MapView_GMapsAPIKey } = this.props;
			const URL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${ mapRegion.latitude },${ mapRegion.longitude }&key=${ MapView_GMapsAPIKey }`;
			const response = await fetch(URL);
			const responseJson = await response.json();
			const userLocation = responseJson.results[0];
			this.setState({
				userLocation,
				regionChangeProgress: false,
				// isNetworkRequest: false
			});
			return responseJson;
		} catch (error) {
			throw error;
		}
	};

	focusMap = () => {
		const { currentRegion } = this.state;
		if (currentRegion && currentRegion.latitude) {
			this._mapView.animateToRegion(currentRegion, 500);
		} else {
			// eslint-disable-next-line no-lonely-if
			if (Platform.OS === 'android') {
				this.handleGPSProviderEvent();
			}
		}
	};

	handleGPSProviderEvent = () => {
		showConfirmationAlert({
			message: I18n.t('Open_GPS_Android'),
			callToAction: I18n.t('Confirm'),
			onPress: async() => {
				// eslint-disable-next-line no-useless-catch
				try {
					await RNSettings.openSetting(RNSettings.ACTION_LOCATION_SOURCE_SETTINGS);
				} catch (e) {
					throw e;
				}
			}
		});
	}

	onRegionChangeComplete = (region, lat, lng) => {
		const { latitude, longitude } = this.state;
		this.setState(
			{
				mapRegion: region,
				latitude: lat || latitude,
				longitude: lng || longitude,
				regionChangeProgress: true
			},
			() => this.fetchAddress()
		);
	};

	renderHeader = () => {
		const { theme, navigation } = this.props;
		return (
			<View style={[styles.headerContainer, { backgroundColor: themes[theme].headerBackground }]}>
				{/* <StatusBar theme={theme} /> */}
				<View style={styles.headerButton}>
					<CloseModalButton navigation={navigation} />
				</View>
				<View style={{ width: '100%', alignItems: 'center' }}>
					<Text style={[styles.textHeader, { color: themes[theme].headerTitleColor }]}>
						{I18n.t('location')}
					</Text>
				</View>
				<View style={styles.headerButton} />
			</View>
		);
	}

	render() {
		const {
			theme, navigation, server, user, route
		} = this.props;
		const {
			currentRegion,
			mapRegion,
			nearbySearchResult,
			regionChangeProgress,
			userLocation,
			accuracy,
			isNetworkRequest
		} = this.state;
		const { title, rid, tmid } = route?.params;
		return (
			<SafeAreaView theme={theme}>
				<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
					{this.renderHeader()}
					<View style={{ flex: 1 }}>
						<MapView
							provider={PROVIDER_GOOGLE}
							style={styles.maps}
							customMapStyle={customMapStyle}
							followUserLocation
							showsUserLocation
							followsUserLocation
							loadingEnabled
							ref={(ref) => {
								this._mapView = ref;
							}}
							initialRegion={mapRegion}
							onRegionChangeComplete={this.onRegionChangeComplete}
							getLocationExact={() => { }}
							onUserLocationChange={obj => this.setCurrentUser(obj.nativeEvent)}
						/>

						<TouchableOpacity style={styles.buttonFocus} onPress={this.focusMap} activeOpacity={0.5}>
							<MaterialIcons name='my-location' size={30} color='#000' />
						</TouchableOpacity>

						<View style={styles.markerLocation}>
							<MaterialIcons name='location-on' size={40} color='#db1d39' />
						</View>
					</View>
					<BottomSheetMaps
						nearbySearchResult={nearbySearchResult}
						theme={theme}
						title={title}
						currentRegion={currentRegion}
						accuracy={accuracy}
						regionChangeProgress={regionChangeProgress}
						userLocation={userLocation}
						server={server}
						user={user}
						rid={rid}
						tmid={tmid}
						navigation={navigation}
						isNetworkRequest={isNetworkRequest}
						onPressRefreshAddress={this.onPressRefreshAddress}
					/>
				</View>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	MapView_GMapsAPIKey: state.settings.MapView_GMapsAPIKey, // TODO: KEY MAPVIEW FROM SETTING OF ADMIN
	user: getUserSelector(state),
	server: state.server.server
});

export default connect(mapStateToProps, null)(withTheme(ShareLocation));
