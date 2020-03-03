import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import i18n from '../i18n';
import { ThreadModel } from '../models/threads';
import {appColors} from "../theme/colors";
import {appStyles} from "../theme/style";

const styles = StyleSheet.create({
    item: {
        padding: 30,
        paddingTop: 0,
        marginBottom: 10,
        width: '100%',
        backgroundColor: appColors.light,
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

    allText: {
        flex: 2,
    },

    creatorText: {
        marginBottom: 7,
        marginTop: 5
    }

});

export const TimelineItem = ({ item }: { item: ThreadModel }) => {
    return <View style={[styles.item]}>
    <Text style={[styles.creatorText, appStyles.subTitle]}>Dick Advocaat  ●  Zondag.</Text>


    <View style={[styles.textAndPreview]}>
        <View style={[styles.allText]}>
            <Text style={[appStyles.heading]}>{item.title}</Text>
            <Text style={[appStyles.text]}>{item.description}</Text>
        </View>
        <Image style={[styles.preview]} source={require('../assets/images/voetbalpreview.jpg')} />
    </View>
</View>
};
