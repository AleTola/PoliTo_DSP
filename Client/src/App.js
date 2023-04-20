import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import React, { useState, useEffect, useContext, useRef  } from 'react';
import { Container, Toast} from 'react-bootstrap/';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { PrivateLayout, PublicLayout, PublicToReviewLayout, ReviewLayout, AddPrivateLayout, EditPrivateLayout,  AddPublicLayout, EditPublicLayout, EditReviewLayout, IssueLayout, DefaultLayout, NotFoundLayout, LoginLayout, LoadingLayout, OnlineLayout } from './components/PageLayout';
import { Navigation } from './components/Navigation';

import MessageContext from './messageCtx';
import API from './API';

const url = 'ws://localhost:4000'

const dayjs = require('dayjs');



var mqtt = require('mqtt')
var clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8)
var options = {
  keepalive: 30,
  clientId: clientId,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  will: {
    topic: 'WillMsg',
    payload: 'Connection Closed abnormally..!',
    qos: 0,
    retain: false
  },
  rejectUnauthorized: false
}
var host = 'ws://127.0.0.1:8080'
var client = mqtt.connect(host, options);

function App() {

  const [message, setMessage] = useState('');
  // If an error occurs, the error message will be shown in a toast.
  const handleErrors = (err) => {
    let msg = '';
    if (err.error) msg = err.error;
    else if (String(err) === "string") msg = String(err);
    else msg = "Unknown Error";
    setMessage(msg); // WARN: a more complex application requires a queue of messages. In this example only last error is shown.
  }

  return (
    <BrowserRouter>
      <MessageContext.Provider value={{ handleErrors }}>
        <Container fluid className="App">
          <Routes>
            <Route path="/*" element={<Main />} />
          </Routes>
          <Toast show={message !== ''} onClose={() => setMessage('')} delay={4000} autohide>
            <Toast.Body>{ message }</Toast.Body>
          </Toast>
        </Container>
      </MessageContext.Provider>
    </BrowserRouter>
  )
}

function Main() {

  // This state is used for displaying a LoadingLayout while we are waiting an answer from the server.
  const [loading, setLoading] = useState(true);
  // This state keeps track if the user is currently logged-in.
  const [loggedIn, setLoggedIn] = useState(false);
  // This state contains the user's info.
  const [user, setUser] = useState(null);
  // This state contains the possible selectable filters.
  const [filters, setFilters] = useState({});
  //This state contains the online list.
  const [onlineList, setOnlineList] = useState([]);
  //This state contains the film selections.
  const [filmSelections, setFilmSelections] = useState([]);

  //This state contains the review selections.
  const [reviewSelections, setReviewSelections] = useState([]);
  const [subscribedReviewTopics, setSubscribedReviewTopics] = useState([]);

  const [subscribedTopics, setSubscribedTopics] = useState([]);

  // Error messages are managed at context level (like global variables)
  const {handleErrors} = useContext(MessageContext);

  const location = useLocation();

  let socket = useRef(null);

  //Websockets and MQTT management
  useEffect(() => {
    const ws = new WebSocket(url)

    ws.onopen = () => {
      ws.send('Message From Client');
    }
    
    ws.onerror = (error) => {
      console.log(`WebSocket error: ${error}`);
    }
    
    ws.onmessage = (e) => {
      try {
        messageReceived(e);
      } catch (error) {
        console.log(error);
      }
    }

    const messageReceived = (e) => {
      let datas = JSON.parse(e.data.toString());
      if (datas.typeMessage == "login") {
        setOnlineList(currentArray => {
          var newArray = [...currentArray];
          let flag = 0;
          for (var i = 0; i < newArray.length; i++) {
            if (newArray[i].userId == datas.userId) {
              flag = 1;
            }
          }
          if (flag == 0) {
            newArray.push(datas);
            return newArray;
          } else {
            return newArray;
          }
        });
      }
      if (datas.typeMessage == "logout") {
        setOnlineList(currentArray => {
          var newArray = [...currentArray];
          for (var i = 0; i < newArray.length; i++) {
            if (newArray[i].userId == datas.userId) {
              newArray.splice(i, 1);
            }
          }
          return newArray;
        });
      }
      if (datas.typeMessage == "update") {
        setOnlineList(currentArray => {
          let flag = 0;
          var newArray = [...currentArray];
          for (var i = 0; i < newArray.length; i++) {
            if (newArray[i].userId == datas.userId) {
              flag = 1;
              newArray[i] = datas;
              return newArray;
            }
          }
          if (flag == 0) 
            newArray.push(datas);
          return newArray;
        });
      }  
    }
  
    socket.current = ws;


    client.on('error', function (err) {
      console.log(err)
      client.end()
    })
    
    client.on('connect', function () {
      console.log('client connected:' + clientId)
    })


    client.on('message', (topic, message) => {
      try {
        var parsedMessage = JSON.parse(message);
        if("reviewerId" in parsedMessage){
          if(parsedMessage.staus === "added"){
            client.subscribe(topic);
          }
          updateReviews(topic, parsedMessage);
          if(parsedMessage.staus === "deleted"){
            client.unsubscribe(topic);
          }
        } else {
          if(parsedMessage.status == "deleted"){
            client.unsubscribe(topic);
          }
          displayFilmSelection(topic, parsedMessage);
        }
      } catch(e) {
          console.log(e);
      }
    })

    const displayFilmSelection = (topic, parsedMessage) => {

      setFilmSelections(currentArray => {
        var newArray = [...currentArray]
        var index = newArray.findIndex(x => x.filmId == topic);
        let objectStatus = { filmId: topic, userName: parsedMessage.userName, status: parsedMessage.status };
        index === -1 ? newArray.push(objectStatus) : newArray[index] = objectStatus;
        return newArray;
      });
    }

    const updateReviews = (topic, parsedMessage) => {

      setReviewSelections(currentArray => {
        var newArray = [...currentArray]
        var index = newArray.findIndex(x => x.filmId === String(topic.split("/")[1]) && x.reviewerId === parsedMessage.reviewerId);
        let objectStatus = { filmId: String(topic.split("/")[1]), status: parsedMessage.status, reviewerId: parsedMessage.reviewerId, completed: parsedMessage.completed, reviewDate: dayjs(parsedMessage.reviewDate), rating: parsedMessage.rating, review: parsedMessage.review };
        index === -1 ? newArray.push(objectStatus) : newArray[index] = objectStatus;
        return newArray;
      });
    }

  
    client.on('close', function () {
      console.log(clientId + ' disconnected');
    })
},[]);

  
  /*
   * This function handles the receival of WebSocket messages.
  */
  

  useEffect(() => {
    const init = async () => {
        setLoading(true);

        // Define filters 
        const filters = ['private', 'public', 'public/to_review', 'online'];
        setFilters(filters);
        // NOTE: this method is called before getUserInfo because if not logged an exception is rised and it would be skipped

        //const user = await API.getUserInfo();  // here you have the user info, if already logged in
        if(localStorage.getItem('userId') != undefined){
          setUser(localStorage.getItem('userId'));
          setLoggedIn(true);
          setLoading(false);
        } else {
          setUser(null);
          setLoggedIn(false);
          setLoading(false);
        } 
    };
    init();
  }, []);  // This useEffect is called only the first time the component is mounted.

  /**
   * This function handles the login process.
   * It requires a email and a password inside a "credentials" object.
   */
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('username', user.name);
      localStorage.setItem('email', user.email);
      setUser(user);
      setLoggedIn(true);
    } catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      throw err;
    }
  };

  /**
   * This function handles the logout process.
   */ 
  const handleLogout = async () => {
    await API.logOut();
    
    setLoggedIn(false);
    setUser(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
  };

  


  return (
    <>
      <Navigation logout={handleLogout} user={user} loggedIn={loggedIn} />

      <Routes>
        <Route path="/" element={
          loading ? <LoadingLayout />
            : loggedIn ? <DefaultLayout filters={filters} onlineList={onlineList}/>
              : <Navigate to="/login" replace state={location} />
        } >
          <Route index element={<PrivateLayout/>} />
          <Route path="private" element={<PrivateLayout/>} />
          <Route path="private/add" element={<AddPrivateLayout />} />
          <Route path="private/edit/:filmId" element={<EditPrivateLayout />} />
          <Route path="public" element={<PublicLayout/>} />
          <Route path="public/add" element={<AddPublicLayout />} />
          <Route path="public/edit/:filmId" element={<EditPublicLayout />} />
          <Route path="public/:filmId/reviews" element={<ReviewLayout client={client} reviewSelections={reviewSelections} subscribedReviewTopics={subscribedReviewTopics} setSubscribedReviewTopics={setSubscribedReviewTopics}/>} />
          <Route path="public/:filmId/reviews/complete" element={<EditReviewLayout/>} />
          <Route path="public/:filmId/issue" element={<IssueLayout/>} />
          <Route path="public/to_review" element={<PublicToReviewLayout onlineList={onlineList} filmSelections={filmSelections} client={client} subscribedTopics={subscribedTopics} setSubscribedTopics={setSubscribedTopics}/>} />
          <Route path="online" element={<OnlineLayout onlineList={onlineList}/>} />
          <Route path="*" element={<NotFoundLayout />} />
        </Route>

        <Route path="/login" element={!loggedIn ? <LoginLayout login={handleLogin} /> : <Navigate replace to='/' />} />
      </Routes>
    </>
  );
}

export default App;
