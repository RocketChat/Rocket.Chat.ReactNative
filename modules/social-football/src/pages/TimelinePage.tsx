import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, Button, ScrollView, RefreshControl } from 'react-native';
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
import { InfiniteScrollView } from "../components/InfiniteScrollView";
import { HeaderLeaderboardButton } from '../components/header/HeaderLeaderboardButton';
import { HeaderTitle } from 'react-navigation-stack';
import ModalDropdown from 'react-native-modal-dropdown';
import Constants from 'expo-constants';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#FFF1E5'
    },

    icon: {
        marginTop: 7,
    },

    filterBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF1E5',
        justifyContent: 'space-between',
        height: 30,
        width: '100%',
        paddingTop: 5,
        paddingLeft: 25,
        paddingRight: 25,
    },

    filterText: {
        flexDirection: 'row',
        fontWeight: 'bold',
    },


});

function wait(timeout) {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  }

const TimelinePage = ({ navigation }) => {
    const perPage = 6;

    const { data, error, fetchMore, loading } = useQuery<{ getThreads: PaginatedThreads }>(ThreadsQueries.TIMELINE, {
        variables: {
            limit: perPage,
        },
        fetchPolicy: "cache-and-network"
    });

    const fetchMoreResults = () => {
        if (loading) {
            return;
        }

        if (!fetchMore) {
            return;
        }

        fetchMore({
            variables: {
                offset: data?.getThreads.threads.length,
                limit: perPage,
            },
            updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;

                return {
                    getThreads: {
                        threads: [...prev.getThreads.threads, ...fetchMoreResult.getThreads.threads],
                        limit: perPage,
                        offset: fetchMoreResult.getThreads.offset,
                        total: prev.getThreads.threads.length + fetchMoreResult.getThreads.threads.length,
                    },
                }
            },
        })
    };

    return <>

        <View style={[styles.filterBar]}>
            {/* <ModalDropdown options={['Alle Berichten', 'Teskt', 'Foto', 'Video', 'Nog wat', 'Teskt']}>
               <Text style={[styles.filterText]}> Alle berichten <Image style={[]} source={require('../assets/images/filter_arrow.png')} /></Text>
            </ModalDropdown> */}

            <View style={[styles.filterText]}>
                <ModalDropdown
                    textStyle={{ fontSize: 15, fontWeight: 'bold' }}
                    dropdownTextStyle={{ fontSize: 13, fontWeight: 'bold' }}
                    dropdownStyle={{ width: '90%', height: 150 }}
                    defaultValue={['Alle berichten ']}
                    defaultIndex= '0'
                    options={['Alle berichten ','Tekst ', 'Foto ', 'Video ', 'Nog wat ', 'Tekst ']} />
                <Image style={[styles.icon]} source={require('../assets/images/filter_arrow.png')} />
            </View>

            <Image style={[]} source={require('../assets/images/refresh.png')} />

        </View>

        <InfiniteScrollView
         onEndReached={() => fetchMoreResults()}>
            <View style={styles.container}>
                {data?.getThreads.threads.map((item, index) => <TimelineItem key={index} item={item} />)}
            </View>
        </InfiniteScrollView>
    </>;

};

TimelinePage.navigationOptions = ({ navigation }) => {
    return {
        headerTitle: <HeaderLogo />,
        headerRight: <HeaderCreateThreadButton navigation={navigation} />,
        headerLeft: <HeaderLeaderboardButton navigation={navigation} />,
    };
};
  
export default TimelinePage;
