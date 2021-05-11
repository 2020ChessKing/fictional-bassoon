import { StatusBar } from 'expo-status-bar';
import React from 'react';
import db from '../config.js';
import firebase from 'firebase';
import { StyleSheet, Text, View, TextInput, TouchableHighlight, TouchableOpacity, ScrollView, FlatList, Platform, Alert, ToastAndroid, Modal, KeyboardAvoidingView } from 'react-native';
import styles from '../Styles/index.js';
import MyHeader from '../Components/Header.js'
import { BookSearch } from "react-native-google-books";
import { ListItem } from 'react-native-elements';

export default class RequestScreen extends React.Component 
{
    constructor()
    {
        super();
        this.state = {
            UserId : firebase.auth().currentUser.email,
            BookName : '',
            RequestReason : '',
            isRequestAldready : false,
            RequestedBookName : '',
            BookStatus : '',
            RequestId : '',
            UserDocId : '',
            DocId : '',
            DataSource : "",
            ShowFlatList : false,
            ImageLink : "",
        }
    }

    requestBook = async  () =>
    {
        var UserId = this.state.UserId;
        var BookName = this.state.BookName;
        var RequestReason = this.state.RequestReason;
        var randomRequest = this.createUniqueId();
        var books = await BookSearch.searchbook(bookName,'AIzaSyAviTAsMd7Vou-i7S0VuzmQe5iGbaFRVuI')
        db.collection('requestedBooks').add({
            "UserID" : UserId,
            "BookName" : BookName,
            "RequestReason" :  RequestReason,
            "RequestID" : randomRequest,
            "BookStatus" : "requested",
            "Date" : firebase.firestore.FieldValue.serverTimestamp(),
            "ImageLink" : books.data[0].volumeInfo.imageLinks.smallThumbnail,
        })

        this.getRequestedBooks();

        db.collection('users').where("email", "==", UserId).get()
        .then()
        .then(( snapshot ) =>
        {
            snapshot.forEach(( doc ) =>
            {
                db.collection('users').doc( doc.id ).update({
                    "isBookRequestActive" : true,
                })
            })
        })
        this.setState({
            BookName : '',
            RequestReason : '',
            RequestId : randomRequest,
        })

        return Alert.alert("Book Requested Successfully")
    }

    getRequestStatus = () =>
    {
        db.collection('users').where("email", "==", this.state.UserId).onSnapshot( snapshot =>
            {
                snapshot.forEach( doc => 
                    {
                        this.setState({
                            "isRequestAldready" : doc.data().isBookRequestActive,
                            "UserDocId" : doc.id,
                        })
                    })
            })
    }

    getRequestedBooks = async () =>
    {
        db.collection('requestedBooks').where("UserID", "==", this.state.UserId).get()
        .then(( snapshot ) =>
        {
            snapshot.forEach( doc =>
                {
                    if( doc.data().BookStatus !== "recieved" )
                    {
                        this.setState(
                            {
                                "BookName" : doc.data().BookName,
                                "BookStatus" : doc.data().BookStatus,
                                "RequestId" : doc.data().RequestId,     
                                "DocId" : doc.id,                   
                            }
                        )
                    }
                })
        })
    }

    componentDidMount = () =>
    {
        this.getRequestStatus();
        this.getRequestedBooks();
    }


    refresh = () =>
    {
        this.setState({
            
            BookName : '',
            RequestReason : '',
        })

        alert("Book Requested Successfully");
    }


    createUniqueId = () =>
    {
        return Math.random().toString(36).substring(7);
    }

    sendNotification=()=>{
        //to get the first name and last name
        db.collection('users').where('email','==',this.state.UserId).get()
        .then(( snapshot ) => {
          snapshot.forEach(( doc )=> {
            var fullName = doc.data().fullName;
      
            // to get the donor id and book nam
            db.collection('allNotifications').where('requestId','==',this.state.RequestId).get()
            .then((snapshot)=>{
              snapshot.forEach((doc) => {
                var donorId  = doc.data().donorId
                var bookName =  doc.data().booName
      
                //targert user id is the donor id to send notification to the user
                db.collection('allNotifications').add({
                  "targetedUserId" : donorId,
                  "message" : fullName + " received the book, " + bookName ,
                  "notificationStatus" : "unread",
                  "booName" : bookName
                })
              })
            })
          })
        })
      }

      updateBooks = () =>
      {
          db.collection('requestedBooks').doc( this.state.DocId ).update({
              "BookStatus" : "recieved",
          })
          
          db.collection('users').where("email", "==", this.state.UserId).get()
          .then(( snapshot ) =>
          {
              snapshot.forEach(( doc ) =>
              {
                  db.collection('users').doc( doc.id ).update({
                      "isBookRequestActive" : false,
                  })
              })
          })
      }

      receivedBooks = ( datao ) =>
      {
          db.collection('recievedBooks').add({
              "UserID" : this.state.UserId,
              "BookName" : datao,
              "RequestID" : this.state.RequestId,
              "BookStatus" : "recieved",
          })
      }


    getBooks = async ( bookName ) =>
    {
        this.setState(
            {
                "BookName" : bookName,
            }
        )

        if( bookName.length > 2  )
        {
            var Book = await BookSearch.searchbook( bookName, "AIzaSyAviTAsMd7Vou-i7S0VuzmQe5iGbaFRVuI" );

            this.setState(
                {
                    "DataSource" : Book.data,
                    "ShowFlatList" : true,
                }
            )
        }
    }

    renderItem = ( data ) =>
    {
        var object = { title : data.volumeInfo.title, selfLink : data.selfLinks, BUILink : data.saleInfo.BUILink, imageLink : data.volumeInfo.imageLinks  }
        return(
            <TouchableHighlight activeOpacity = { 0.6 } underlayColor = { "#dddddd" } onPress = {() => { this.setState( { "ShowFlatList" : false, "BookName" : data.volumeInfo.title } ) }} bottomDivider>{ data.volumeInfo.title }</TouchableHighlight>
        );
    }

    keyExtractor = ( item, index ) => index.toString();

    render()
    {
        if( this.state.isRequestAldready === true)
        {
            return(
                <View style = {{flex:1,justifyContent:'center'}}>
                    <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
                        <Text>Book Name : </Text>
                        <Text>{this.state.BookName}</Text>
                    </View>
                    <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
                        <Text> Book Status : </Text>

                        <Text>{this.state.BookStatus}</Text>
                    </View>

                    <TouchableOpacity style={{borderWidth:1,borderColor:'orange',backgroundColor:"orange",width:300,alignSelf:'center',alignItems:'center',height:30,marginTop:30}}
                    onPress={()=>{
                        this.updateBooks();
                        this.receivedBooks(this.state.BookName)
                        this.sendNotification();
                    }}>
                    <Text>I recieved the book </Text>
                    </TouchableOpacity>
                </View>
            );
        }
        else
        {
            return(
                <View>
                    <MyHeader title = { "Request Book" } navigation = { this.props.navigation } />
                    <KeyboardAvoidingView>
                        <TextInput style = { styles.inputBox } placeholder = { "Book Name" } onChangeText = {( data ) => { this.getBooks( data ) } } onClear = {() => { this.getBooks("") }} value = { this.state.BookName }/>
                        <FlatList renderItem = { this.renderItem() } data = { this.state.dataSource } keyExtractor = { this.keyExtractor() }/>
                        <TextInput style = { styles.inputBox } placeholder = { "Reason to Read Book" } onChangeText = {( data ) => { this.setState({ RequestReason : data, }) } }/>
                        <View style = { styles.buttonWrapper }>
                            <TouchableOpacity style = { styles.button } onPress = {() => { this.requestBook(this.state.BookName) }}>
                                <Text style = { styles.buttonText }> Request </Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            );
        }
    }
}