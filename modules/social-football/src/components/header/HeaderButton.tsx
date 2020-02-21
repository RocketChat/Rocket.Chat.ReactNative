import React from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';

const styles = StyleSheet.create({
    holder: {
        width: 35,
        height: 35,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export const HeaderButton = ({ image, onPress, orientation }: { onPress: () => any|void, image: any, orientation: 'left'|'right' }) => (
    <TouchableOpacity style={[styles.holder, { marginLeft: orientation === 'left' ? 10 : 0, marginRight: orientation === 'right' ? 10 : 0}]} onPress={onPress}>
        <Image source={image} />
    </TouchableOpacity>
);