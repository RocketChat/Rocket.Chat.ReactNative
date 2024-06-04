import React, { useState, useEffect, useRef } from 'react';
import { fetchData } from '../../lib/methods/fetchData';
import { VideoData } from '../../definitions/VideoData';
import { SwiperFlatList } from 'react-native-swiper-flatlist';
// @ts-ignore
import { View, Text, Image, StyleSheet, ScrollView, Dimensions} from 'react-native';
import Button from '../../containers/Button';
import Navigation from '../../lib/navigation/appNavigation'
import { sendLoadingEvent } from '../../containers/Loading';
import { ViewToken } from 'react-native';
import FocusableVideo from './FocusableVideo';
import RightSidebar from './RightSideBar';

interface SwiperComponentProps {
  userId: string | undefined;
  onRemindLogin: () => void;
  is_hot: number;
}

export const SwiperComponent: React.FC<SwiperComponentProps> = 
({ userId, onRemindLogin,is_hot}) => {
  const [data, setData] = useState<VideoData[]>();
  const [error, setError] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<number | null>(0);
  const handleFetchData = async () => {
  try {
    sendLoadingEvent({ visible: true });
    
    const result = await fetchData(userId,is_hot);
    
    sendLoadingEvent({ visible: false });
    
    if (result.code !== '0') {
      throw new Error(result.description);
    }
        
    const parsedRows = result.rows[0].array_list;
    
    const videoData: VideoData[] = JSON.parse(parsedRows).map((item: any) => ({
      event_type: item.event_type,
      url: item.url,
      video_path: item.video_path,
      video_review: item.video_review,
      jump_url: item.jump_url,
      surface_img: item.surface_img,
      show_title: item.show_title,
      wx_url: item.wx_url,
      poster_img: item.poster_img,
      video_cover: item.video_cover,
    }));
    setData(videoData);
  } catch (error) {
    sendLoadingEvent({ visible: false });
    console.error("Error fetching data: ", error);
  }
};

const onViewableItemsChanged = ({changed, viewableItems }: { changed: ViewToken[], viewableItems: ViewToken[] }) => {
  console.log("changed", changed);
  console.log('viewableItems', viewableItems);
  console.log("is hot ", is_hot)
  changed.forEach((item) => {
    if (item.isViewable) {
      if (item.index == null) {
        setFocusId(item.index);
      } else {
        setFocusId(item.index * 10 + is_hot)        
       //  setFocusId(item.index);

      }
    } else if (focusId === item.index) {
      setFocusId(null);  // Or set to another viewable index
    }
  })
    
};

const videoError = () => {
  console.error("Unable to load video: ");
  // Additional error handling logic can be added here
};

useEffect(() => {
    // Fetch data initially when the component mounts
    handleFetchData();
    console.log("Data is :", data);
    // Set up an interval to fetch data every hour
    const interval = setInterval(() => {
      handleFetchData();
    }, 3600000); // 3600000 milliseconds = 1 hour

   // Clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);


  return (
    <View >
    {error && <Text style={styles.error}>Error: {error}</Text>}
    {data ? (
      <SwiperFlatList
        // autoplay
        // autoplayDelay={100}
        // autoplayLoop
        extraData={focusId}
        index={0}
        showPagination = {true}
        data={data}
        onViewableItemsChanged= {onViewableItemsChanged}
        renderItem={({ item, index }) => (
        <View key={item.video_path} style={styles.videoContainer}>
            <Text style={styles.title}>{item.show_title}</Text>    
            <FocusableVideo
              source={item.video_path}
              videoStyle={styles.video}
              onError={videoError}
              posterUri={item.video_cover}
              isFocused={focusId === index * 10 + is_hot}
            />
            <RightSidebar/>
            <View style={styles.scrollArea}>
              <ScrollView
                contentContainerStyle={styles.textBox}>
                <Text style={styles.text}>
                  {item.video_review}
                </Text>
              </ScrollView>
            </View>
            <Button title="Use this template" onPress={onRemindLogin} />
        </View>
        )}
      />
    ) : (
      <Button title="Remind to Login" onPress={onRemindLogin} />
    )}
  </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  error: {
    color: 'red',
  },
  scrollArea: {
    width: 303,
    height: 106,
    backgroundColor: "rgba(230, 230, 230,1)",
    marginTop: 439,
    marginLeft: 18
  },
  videoContainer: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea_contentContainerStyle: {
    height: 106,
    width: 303
  }, 
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  textBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background
    width: 303,
    height: 106
  },
  text: {
    color: '#fff', // White text color
    fontSize: 16,
  }, 
});