import React, { Component } from 'react';
import {
	View,
	SafeAreaView,
	Platform,
	StyleSheet,
	Text,
} from 'react-native';
import styles from './styles'
import MapboxGL from '@react-native-mapbox-gl/maps';
import Geolocation from '@react-native-community/geolocation';

MapboxGL.setAccessToken('pk.eyJ1IjoiYmVubmRpcCIsImEiOiJjazRtdWExYWwweHA4M2tuNTljbmxjcjlmIn0.ji9iFK1hYN1sP1H-Kl99Rw');

const IS_ANDROID = Platform.OS === 'android';

class UserLocationView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isAndriodPermissionGranted : false,
			isFetchingAndroidPermission : IS_ANDROID,
			showUserLocation:true,
			latitude:0.0,
			longitude:0.0,
		};
	}

	async componentDidMount(){
		
		if(IS_ANDROID){
			const isGranted = await MapboxGL.requestAndroidLocationPermissions();
			this.setState({
				isAndriodPermissionGranted : isGranted,
				isFetchingAndroidPermission : false,
			}) 
		};

		 MapboxGL.locationManager.start();
		 Geolocation.getCurrentPosition(info =>{
		 	var lat=parseFloat(info.coords.latitude);
		 	var long=parseFloat(info.coords.longitude);
		 	this.setState({
		 		latitude:lat,
		 		longitude:long
		 	});
		 });
	}

		  	 onUserLocationUpdate(location) {
			    this.setState({
			      latitude: location.coords.latitude,
			      longitude: location.coords.longitude,
			    });
			  }

	render(){
		return(
			<SafeAreaView style={styles.container}>
				<View style={styles.container}>
					<MapboxGL.MapView
						ref={c=>(this._map=c)}
						onUserLocationUpdate={this.onUserLocationUpdate}
						centerCoordinate={[this.state.longitude,this.state.latitude][0]}
						showUserLocation={this.state.showUserLocation}
						style={styles.container}
						userTrackingMode={MapboxGL.UserTrackingModes.Follow}
					>
						<MapboxGL.Camera
							zoomLevel={12}
							animationMode={'flyTo'}
							animationDuration={1500}
							ref={c=>(this.camera=c)}
							centerCoordinate={[this.state.longitude,this.state.latitude]}
						/>
						<MapboxGL.UserLocation />
					</MapboxGL.MapView>
				</View>
			</SafeAreaView>
		)
	}
}

export default UserLocationView;
