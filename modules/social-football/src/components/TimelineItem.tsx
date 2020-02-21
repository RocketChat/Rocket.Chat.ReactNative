import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import i18n from '../i18n';
import { ThreadModel } from '../models/threads';

const styles = StyleSheet.create({
    item: {
        padding: 30,
        paddingTop: 0,
        marginBottom: 10,
        height: 150,
        width: '100%',
        backgroundColor: '#FFFFFF',
    },

    textAndPreview: {
        flexDirection: 'row',
        marginTop: 5,
    },

    preview: {
        flex: 1,
        width: 100,
        height: 80,
        borderRadius: 10,
    },

    threadTitle: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 15
    },

    allText: {
        flex: 2,
    },

    threadText: {
        color: 'black',
        fontSize: 15
    },

    creatorText: {
        color: '#B0B0B0',
        fontSize: 13,
        marginBottom: 7,
        marginTop: 5
    }

});

export const TimelineItem = ({ item }: { item: ThreadModel }) => {
    return <View style={[styles.item]}>
    <Text style={[styles.creatorText]}>Dick Advocaat  ●  Zondag.</Text>


    <View style={[styles.textAndPreview]}>
        <View style={[styles.allText]}>
            <Text style={[styles.threadTitle]}>{item.title}</Text>
            <Text style={[styles.threadText]}>{item.description}</Text>
        </View>
        <Image style={[styles.preview]} source={require('../assets/images/voetbalpreview.jpg')} />
    </View>
</View>
};