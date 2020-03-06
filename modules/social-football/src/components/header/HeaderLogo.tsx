import React from 'react';
import { Image, StyleSheet, Platform } from 'react-native';

/**
 * Defining the Logo within the Header.
 */

const styles = StyleSheet.create({
    logo: {
        width: 70,
        resizeMode: 'contain',
        marginTop: Platform.OS === 'ios' ? -10 : 0,
        alignSelf: 'center',
        flex:1,
        height:35
    }
});

export const HeaderLogo = () => (
    <Image style={styles.logo} source={require('../../assets/images/app-logo-white.png')} />
)