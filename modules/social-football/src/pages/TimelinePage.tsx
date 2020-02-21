import React from 'react';
import { Image, View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView } from 'react-navigation';
import { appColors } from '../theme/colors';
import i18n from '../i18n'
import { HeaderLogo } from '../components/header/HeaderLogo';
import { HeaderCreateThreadButton } from '../components/header/HeaderCreateThreadButton';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#FFF1E5'
    },

    topbar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 30,
        paddingRight: 30,
        height: 50,
        width: '100%',
        backgroundColor: '#F18217',
    },

    icon: {
        width: 25,
        height: 25,
    },

    filterbar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 25,
        width: '100%',
        paddingLeft: 30,
        paddingRight: 30,
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

    filterText: {
        fontWeight: 'bold'
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

const TimelinePage = ({ navigation }) => (
    <SafeAreaView>
        <ScrollView>

            <View style={[styles.topbar]}>
                <Image style={[styles.icon]} source={require('../assets/images/trophy.png')} />
                <Image style={[styles.logo]} source={require('../assets/images/topbar-logo.png')} />
                <Image source={require('../assets/images/create-thread.png')} />
            </View>

            <View style={[styles.filterbar]} >
                <Text style={[styles.filterText]}>Alle berichten.</Text>
                <Image style={[styles.logo]} source={require('../assets/images/refresh.png')} />

            </View>


            <View style={styles.container}>

                <View style={[styles.item]}>
                    <Text style={[styles.creatorText]}>Dick Advocaat  ●  Zondag.</Text>


                    <View style={[styles.textAndPreview]}>
                        <View style={[styles.allText]}>
                            <Text style={[styles.threadTitle]}>{i18n.t('appName')}</Text>
                            <Text style={[styles.threadText]}>Dit is de beschijving van deze thread met een afbeelding die... </Text>
                        </View>
                        <Image style={[styles.preview]} source={require('../assets/images/voetbalpreview.jpg')} />
                    </View>
                </View>

                <View style={[styles.item]} />
                <View style={[styles.item]} />
                <View style={[styles.item]} />
                <View style={[styles.item]} />


            </View>
        </ScrollView>
    </SafeAreaView>

);

TimelinePage.navigationOptions = ({ navigation }) => {
    return {
        headerTitle: <HeaderLogo />,
        headerRight:  <HeaderCreateThreadButton navigation={navigation} />
    };
};

export default TimelinePage;
