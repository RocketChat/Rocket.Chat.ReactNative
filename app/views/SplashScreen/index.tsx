import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import BootSplash from 'react-native-bootsplash';
import Navigation from '../../lib/navigation/appNavigation';


const SplashScreen: React.FC = ({}) => {
  useEffect(() => {
    BootSplash.hide({ fade: true });
    setTimeout(() => {
      Navigation.navigate('MainTabs');
    }, 3000);
  }, [Navigation]);

  const onSomething = async (index: number) => {
    // Function implementation
  };

  return (
    <SafeAreaView style={styles.container}>
      <FastImage
        style={styles.image}
        source={{
          uri: "/Users/liwanyi/Desktop/Rocket.Chat.ReactNative/app/static/images/loading.gif", // Update the URL accordingly
          priority: FastImage.priority.normal,
        }}
        resizeMode={FastImage.resizeMode.contain}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;
