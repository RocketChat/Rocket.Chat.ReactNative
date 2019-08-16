import React from 'react'
import { View, FlatList, Text } from 'react-native'

import { Q } from '@nozbe/watermelondb'
import withObservables from '@nozbe/with-observables'

// import ListItem from './helpers/ListItem'

const RawBlogItem = ({ blog, onPress }) => (
  <Text>{blog.name}</Text>
)

const BlogItem = withObservables(['blog'], ({ blog }) => ({
  blog: blog.observe(),
}))(RawBlogItem)

const BlogList = ({ blogs, navigation }) => (
  <View>
    {/* {blogs.map(blog => (
      <BlogItem blog={blog} key={blog.id} onPress={() => navigation.navigate('Blog', { blog })} />
    ))} */}
    <FlatList
      data={blogs}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <BlogItem blog={item} key={item.id} onPress={() => navigation.navigate('Blog', { blog: item })} />}
    />
  </View>
)
const enhance = withObservables(['search'], ({ database, search }) => ({
  blogs: database.collections
    .get('subscriptions')
    .query()
    .observe()
}))

export default enhance(BlogList)
