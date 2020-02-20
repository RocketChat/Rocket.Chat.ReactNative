import React from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';

const styles = StyleSheet.create({
    holder: {
        width: 35,
        height: 35,
        marginRight: 10,
    }
});

export const HeaderButton = ({ image, onPress }: { onPress: () => any|void, image: any }) => (
    <TouchableOpacity style={styles.holder} onPress={onPress}>
        <Image source={image} />
    </TouchableOpacity>
);