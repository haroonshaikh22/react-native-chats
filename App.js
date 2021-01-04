import React, {useState,useEffect,useCallback}from 'react';
import {GiftedChat} from 'react-native-gifted-chat'
import AsyncStorage from '@react-native-community/async-storage'
import { StyleSheet,TextInput,Button, View } from 'react-native';
import * as firebase from 'firebase'
import 'firebase/firebase-firestore'

const firebaseConfig = {
  //Your firebase config here
  apiKey: "AIzaSyC7_pogJd48zpWXUGQNIui8qFAzEz_tSvg",
  authDomain: "chatapp-a0865.firebaseapp.com",
  databaseURL: "https://chatapp-a0865-default-rtdb.firebaseio.com",
  projectId: "chatapp-a0865",
  storageBucket: "chatapp-a0865.appspot.com",
  messagingSenderId: "700398215612",
  appId: "1:700398215612:web:6207a52b3a00167eda0bb9"
}

if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig)
}

// LogBox.ignoreWarnings(['Setting a timer for a long period of time'])

const db = firebase.firestore()
const chatsRef = db.collection('chats')

export default function App() {
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
      readUser()
      const unsubscribe = chatsRef.onSnapshot((querySnapshot) => {
          const messagesFirestore = querySnapshot
              .docChanges()
              .filter(({ type }) => type === 'added')
              .map(({ doc }) => {
                  const message = doc.data()
                  //createdAt is firebase.firestore.Timestamp instance
                  //https://firebase.google.com/docs/reference/js/firebase.firestore.Timestamp
                  return { ...message, createdAt: message.createdAt.toDate() }
              })
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          appendMessages(messagesFirestore)
      })
      return () => unsubscribe()
  }, [])

  const appendMessages = useCallback(
      (messages) => {
          setMessages((previousMessages) => GiftedChat.append(previousMessages, messages))
      },
      [messages]
  )

  async function readUser() {
      const user = await AsyncStorage.getItem('user')
      if (user) {
          setUser(JSON.parse(user))
      }
  }
  async function handlePress() {
      const _id = Math.random().toString(36).substring(7)
      const user = { _id, name }
      await AsyncStorage.setItem('user', JSON.stringify(user))
      setUser(user)
  }
  async function handleSend(messages) {
      const writes = messages.map((m) => chatsRef.add(m))
      await Promise.all(writes)
  }

  if (!user) {
      return (
          <View style={styles.container}>
              <TextInput style={styles.input} placeholder="Enter your name" value={name} onChangeText={setName} />
              <Button onPress={handlePress} title="Enter the chat" />
          </View>
      )
  }
  return <GiftedChat messages={messages} user={user} onSend={handleSend} />
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
  },
  input: {
      height: 50,
      width: '100%',
      borderWidth: 1,
      padding: 15,
      marginBottom: 20,
      borderColor: 'gray',
  },
})
