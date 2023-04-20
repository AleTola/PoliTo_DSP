class MQTTReviewMessage {    
    constructor(status, reviewerId, completed, reviewDate, rating, review) {
        
        this.status = status;
        this.reviewerId = reviewerId;
        this.completed = completed;

        if(reviewDate)
            this.reviewDate = reviewDate;
        if(rating)
            this.rating = rating;
        if(review)
            this.review = review;
    }
}

module.exports = MQTTReviewMessage;