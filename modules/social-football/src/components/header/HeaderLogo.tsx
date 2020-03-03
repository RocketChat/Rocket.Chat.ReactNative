import React from 'react';
import { Image, StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
    logo: {
        width: 70,
        resizeMode: 'contain',
        marginTop: Platform.OS === 'ios' ? -10 : 0,
        alignSelf: 'center',
    }
});

export const HeaderLogo = () => (
    <Image style={styles.logo} source={require('../../assets/images/app-logo-white.png')} />
)