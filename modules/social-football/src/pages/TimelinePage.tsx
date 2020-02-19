import React from 'react';
import { Image, View, Text, Picker, StyleSheet, Button, ScrollView } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView } from 'react-navigation';
import { appColors } from '../theme/colors';
import i18n from '../i18n'
//import { Icon } from 'antd';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#FFF1E5'
    },

    topbar: {
        height: 50,
        width: '100%',
        backgroundColor: '#F18217',
    },

    logo: {
        height: 30,
        width: '10%',
        backgroundColor: '#F18217',
    },

    filterbar: {
        height: 25,
        width: '100%',
        backgroundColor: '#FFF1E5',
    },

    item: {
        padding: 30,
        paddingTop: 0,
        marginBottom: 10,
        height: 150,
        width: '100%',
        backgroundColor: '#FFFFFF',
    },

    preview: {
        width: 100,
        height: 75,
        marginLeft: '75%',
        borderRadius: 10,
    },

    filterText: {
        marginLeft: 20,
        fontWeight: 'bold'
    },

    threadTitle: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 15
    },

    threadText: {
        color: 'black',
    },

    creatorText: {
        color: '#B0B0B0',
        fontSize: 13,
        marginBottom: 5
    }

});

const TimelinePage = ({ navigation }) => (
    <SafeAreaView>
        <ScrollView>
            <View style={[styles.topbar]}>
                <Image style={[styles.logo]} source={require('../assets/images/app-logo.png')} />
            </View>

            <View style={styles.container}>

                <View style={[styles.filterbar]} >
                    <Text style={[styles.filterText]}>Alle berichten.</Text>
                </View>

                <View style={[styles.item]}>
                    <Text style={[styles.creatorText]}>Dick Advocaat Zondag.</Text>
                    <Text style={[styles.threadTitle]}>{i18n.t('appName')}</Text>
                    <Text style={[styles.threadText]}>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</Text>
                    <Image style={[styles.preview]} source={require('../assets/images/voetbalpreview.jpg')} />
                 </View>

                <View style={[styles.item]} />
                <View style={[styles.item]} />
                <View style={[styles.item]} />
                <View style={[styles.item]} />
            </View>
        </ScrollView>
    </SafeAreaView>

);

export default TimelinePage;