# Exam Call 2

The structure of this repository is the following:
  - "Client" contains the code of the REACT client implementation;
  - "Mosquitto Configuration" contains the Eclipse Mosquitto configuration file;
  - "REST APIs Design" contains the OpenAPI document describing the design of the REST APIs;
  - "Server" contains the code of the Film Manager service application;
  - "Server/json_schemas" contains the design of the JSON Schemas.

## **Introduction**

My solution for this exam call is based on the code provided in the official solution for Lab05.

I've extended the REST APIs, by introducing the possibility to retrieve all the public films that the logged-in user has been invited to review, without pagination.

## **APIs**

Inside index.js file I've added comments to indicate the new API that I've created and the one that I've modified with respect to the provided Lab05 solution.

### New 
- GET : /api/films/public/all

### Modified
- UPDATE : api/films/public/:filmId/reviews/:reviewerId


## **MQTT Design choices**

Each client when visit the "public/:filmId/reviews" page that shows the reviews for that film, will subscribe to the topic 'review/filmId/#' for each one of the films that have been issued to the current user to be reviewed.

Whenever a modification to a review for a public film is performed the server informs all the 'interested' clients by means of MQTT messages. A client can express its interest subscribing to the topic "review/filmId/#", as I explained before, in order to be updated about all the reviews of that specific public film or subscribing to the topic "review/filmId/reviewerId" if it is interested in being updated only for that specific review.

These MQTT messages contain JSON objects that carry the full information about the updated review and if the review is been deleted, added or updated.

- I set the message to be sent with **QoS 0**, so it is not guaranteed to be delivered to the client. If the client is disconnected, the message may be lost. 
- I also set the **"retain" flag to false**, so the broker will not store the last message published on that topic. This means that new subscribers will not receive the last message when they subscribe to that topic.

MQTT Film Review message:
- topic: 'review/filmId/reviewerId'
- message: { 'status', 'reviewerId', 'completed', 'reviewDate', 'rating', 'review' }
- configurations: { qos: 0, retain: false }





