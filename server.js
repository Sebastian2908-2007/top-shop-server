/**import express */
const express = require('express');
/**import apollo server */
const { ApolloServer } = require('apollo-server-express');
/**import schema stuff typedefs resolvers */
const {typeDefs, resolvers} =require('./schemas');
const path = require('path');
var cors = require('cors');
/*db connection */
const db = require('./config/connection');
const { authMiddleware } = require('./utils/authorize');

var whitelist = ['https://topshop1188.herokuapp.com', 'https://topshop1188.herokuapp.com/addresscheckout']
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true
    }

   
  
/*port */
const PORT = process.env.PORT || 3001;
const app = express();

/**make apolloserver function */
const startServer = async () => {
    const server = new ApolloServer({
        cors: corsOptions,
        typeDefs,
        resolvers,
        /*csrfPrevention: true,
        cache: 'bounded',*/
        context: authMiddleware
    });
    /**start apollo server */
    await server.start();

    /**apply express as middleware */
    server.applyMiddleware({ app, cors: false  });

    /*log grapql url */
   console.log(`Use graphql at http://localhost:${PORT}${server.graphqlPath}`);
    //console.log(server);
};

startServer()

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());



db.once('open', () => {
    app.listen(PORT, () => {
        console.log(`API server running on ${PORT} !!! Yeah boy!`);
    });
});


/*-p $PORT*/