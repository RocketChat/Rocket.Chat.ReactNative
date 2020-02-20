import React from 'react';
import { Image, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    logo: {
        width: 70,
        resizeMode: 'contain',
        marginTop: -10,
    }
});

export const HeaderLogo = () => (
    <Image style={styles.logo} source={require('../../assets/images/app-logo-white.png')} />
)