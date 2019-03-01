import React from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
//   StatusBar,
  StyleSheet,
  View,
} from 'react-native';

export default class AuthLoadingView extends React.Component {
  constructor(props) {
    super(props);
	// this._bootstrapAsync();
	setTimeout(() => {
		this.props.navigation.navigate('OutsideStack');
	}, 2000);
  }

  // Fetch the token from storage then navigate to our appropriate place
//   _bootstrapAsync = async () => {
//     const userToken = await AsyncStorage.getItem('userToken');

//     // This will switch to the App screen or Auth screen and this loading
//     // screen will be unmounted and thrown away.
//     this.props.navigation.navigate(userToken ? 'App' : 'Auth');
//   };

  // Render any loading content that you like here
  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#ccc', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        {/* <StatusBar barStyle="default" /> */}
      </View>
    );
  }
}