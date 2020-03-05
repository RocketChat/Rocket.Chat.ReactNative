import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import {Button} from "../components/Button";
import {PublishButton} from "../components/PublishButton";
import i18n from '../i18n';
import { ThreadModel } from '../models/threads';
import { useMutation } from 'react-apollo';
import {PUBLISH_THREAD} from "../api/mutations/threads.mutations";

const styles = StyleSheet.create({
    item: {
        padding: 30,
        paddingTop: 0,
        marginBottom: 10,
        width: '100%',
        backgroundColor: '#FFFFFF',
    },

    hiddenItem: {
        padding: 30,
        paddingTop: 0,
        marginBottom: 10,
        width: '100%',
        backgroundColor: '#D3D3D3',
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

    publish: {
        flex: 1,
        width: 100,
        height: 20,
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
        marginTop: 5,
    },

    hiddenCreatorText: {
        color: '#200000',
        fontSize: 13,
        marginBottom: 7,
        marginTop: 5,
    },

    hiddenButton: {
        color: '#DDDDDD'
    }

});

const [performPublish, {data, loading, error}] = useMutation<{ publishThread: boolean }>(PUBLISH_THREAD);
const thread = {
    published: false,
};

const publishPress = () => {
    performPublish({
        variables: {
            thread,
        }
    });
}

const renderPublishButton = (item) => {
    if(!item.published){
        return(
        <View style={[styles.publish]}>
            <PublishButton title={i18n.t('createThread.publish')}  onPress={() => publishPress } />
        </View>
        )
    } 
    return;
}

export const TimelineItem = ({ item }: { item: ThreadModel }) => {
    
    return <View style={item.published ? [styles.item] : [styles.hiddenItem]}>
    <Text style={item.published ? [styles.creatorText] : [styles.hiddenCreatorText]}>Dick Advocaat  ●  Zondag.</Text>

    <View style={[styles.textAndPreview]}>
        <View style={[styles.allText]}>
            <Text style={[styles.threadTitle]}>{item.title}</Text>
            <Text style={[styles.threadText]}>{item.description}</Text>
        </View>
        <Image style={[styles.preview]} source={require('../assets/images/voetbalpreview.jpg')} />
        
    </View>
    {renderPublishButton(item)}
</View>
};