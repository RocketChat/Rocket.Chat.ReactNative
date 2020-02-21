import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView } from 'react-navigation';
import { appColors } from '../theme/colors';
import i18n from '../i18n'
import { HeaderLogo } from '../components/header/HeaderLogo';
import { HeaderCreateThreadButton } from '../components/header/HeaderCreateThreadButton';
import { useQuery } from 'react-apollo';
import { ThreadsQueries } from '../api';
import { PaginatedThreads } from '../models/threads';
import { TimelineItem } from '../components/TimelineItem';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#FFF1E5'
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

    filterText: {
        fontWeight: 'bold'
    },

});

const TimelinePage = ({ navigation }) => {
    const offset = useState(0);
    const limit = useState(10);

    const { data, error } = useQuery<{ getThreads: PaginatedThreads }>(ThreadsQueries.TIMELINE, {
        variables: {
            offset,
            limit,
        }
    });

    console.info(error);
    console.info(data);

    return <SafeAreaView>
        <ScrollView>
            <View style={[styles.filterbar]} >
                <Text style={[styles.filterText]}>Alle berichten.</Text>
                <Image style={[]} source={require('../assets/images/refresh.png')} />

            </View>


            <View style={styles.container}>
                {data?.getThreads.threads.map((item, index) => <TimelineItem key={index} item={item} />)}
            </View>
        </ScrollView>
    </SafeAreaView>
};

TimelinePage.navigationOptions = ({ navigation }) => {
    return {
        headerTitle: <HeaderLogo />,
        headerRight: <HeaderCreateThreadButton navigation={navigation} />
    };
};

export default TimelinePage;
