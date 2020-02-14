import React from 'react';
import { Image, View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView } from 'react-navigation';
import { appColors } from '../theme/colors';
import i18n from '../i18n'

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
    },
    item: {
        padding: 5,
        marginTop: 20,
        height: 150,
        width: '80%',
        backgroundColor: appColors.primary,
        borderRadius: 20,
    },

    preview: {
        width: 50,
        height: 100,
        marginLeft: '75%',
    }

});

const TimelinePage = ({ navigation }) => (
    <SafeAreaView>
        <ScrollView>
            <Text style={[appStyles.title, { textAlign: 'center' }, { marginBottom: 5 }]}>Timeline page</Text>
            <Button title='Ga terug' onPress={() => navigation.navigate('LoginPage')} />

            <View style={styles.container}>

                <View style={[styles.item]}>
                    <Text>{i18n.t('appName')}</Text>
                    <Text>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.
                        Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.</Text>
                    <Image style={[styles.preview]} source={require('../assets/images/Voetbalveld.png')} />
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