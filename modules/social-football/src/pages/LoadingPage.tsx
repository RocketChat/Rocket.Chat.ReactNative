import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
    activityHolder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    }
});

const LoadingPage = () => (<View style={[styles.activityHolder]}><ActivityIndicator /></View>);

export default LoadingPage;