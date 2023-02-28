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

/*port */
const PORT = process.env.PORT || 3001;
const app = express();

/**make apolloserver function */
const startServer = async () => {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        csrfPrevention: true,
        cache: 'bounded',
        context: authMiddleware
    });
    /**start apollo server */
    await server.start();

    /**apply express as middleware */
    server.applyMiddleware({ app });

    /*log grapql url */
   console.log(`Use graphql at http://localhost:${PORT}${server.graphqlPath}`);
    //console.log(server);
};

startServer()

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());



db.once('open', () => {
    app.listen(PORT, () => {
        console.log(`API server running on ${PORT} !!! Yeah boy!`);
    });
});


/*-p $PORT*/