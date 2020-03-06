import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import i18n from '../i18n';
import { ThreadModel } from '../models/threads';
import {appColors} from "../theme/colors";
import {appStyles} from "../theme/style";
import moment from "moment";
import 'moment/locale/nl';
import Urls from "../../../../app/containers/message/Urls"
import {ContentType} from '../enums/content-type';

/**
 * Defining the Metadata for an Item within the Timeline.
 */

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
    
    const getUserId = (item:ThreadModel) => {
        // const { data, error, fetchMore, loading } = useQuery<{ getUser:UserModel }>(UserQueries.GetUserFromID, {
        //     variables: {
        //         createdByUserId: item.createdByUserId
        //     }
        // });


        // if(loading){
        //     return <Text>Loading + {loading}</Text>
        // }
        // if(error){
        // return <Text>Error + {error.message}  - {error.networkError?.message}</Text>
        // }
        // if(data?.getUser){ 
        //     return <Text>Name: {data?.getUser.firstName}  !</Text>
        // }
      //  else
         if (item.createdByUserId){
            return <Text>{item.createdByUserId}</Text>;
        }
        return ;

    }

    const renderPreview = () => {
        if((item.type == ContentType.YOUTUBE || item.type == ContentType.LINK) && item.assetMetadata){
            return <Urls urls={[item.assetMetadata!]} user={{}} />
        }
    };
    const renderImageInfo = (item:ThreadModel) => {
        if(item.assetMetadata)
            return <Image style={[styles.preview]}  source={{uri: item.assetMetadata.image}}        />;
        else
            return;
     };
    const showLink = (item:ThreadModel) => {
        if(item.type == ContentType.LINK && item.assetUrl)
            return <Text 
                style={[styles.linkText]}
                onPress={() => Linking.openURL('www.google.com')}
                >
                {item.assetUrl}
                </Text>;
        else
            return;
    };
    const showDate = (item:ThreadModel)=>{
         moment.locale();
         if(item.updatedAt){
             return <Text>{moment(item.updatedAt).fromNow()}</Text>
         }
        return <Text>{moment(item.createdAt).fromNow()}</Text>


    }
    const checkUpdated = (item:ThreadModel)=>{
        if(!item.updatedAt){
            return;
        }
        else{
            return <Text> ● Bewerkt</Text>
        }
    }
    return <View style={[styles.item]}>
    <Text style={[styles.creatorText]}> { getUserId(item) }  ●  {showDate(item)}{checkUpdated(item)}</Text>
    {/* <Text>{renderLinkInfo(item)}</Text> */}
    <View style={[styles.textAndPreview]}>
        <View style={[styles.allText]}>
            <Text style={[appStyles.heading]}>{item.title}</Text>
            <Text style={[appStyles.text]}>{item.description}</Text>
            {/* {showLink(item)} */}
            {getUserId(item)}
        </View>
        {renderImageInfo(item)}

        </View>
    {/* {renderPreview()} */}
    </View>

};