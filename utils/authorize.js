const jwt = require('jsonwebtoken');
require('dotenv').config();
const secret = process.env.JWT_SECRET;
const expiration = process.env.JWT_EXPIRATION;

module.exports = {
    signToken: function({firstName, lastName,email,isAdmin,_id,hasLeftReview}) {
        const payload = {firstName, lastName,email,isAdmin,_id,hasLeftReview};
        return jwt.sign({data: payload},secret,{ expiresIn: expiration });
    },

    authMiddleware: function({req}) {
        let token = req.body.token || req.query.token || req.headers.authorization;

        if(req.headers.authorization) {
        token = token
        .split(' ')
        .pop()
        .trim()
        .split('"')[0]
        }
    
    if(!token) {
        console.log('there is no token');
        return;
    }
    try {
        if(token) {
            const { data } = jwt.verify(token, secret, { maxAge: expiration });
            console.log('You have a token my friend118811');
            req.user = data;
        }
    }catch{
       console.log('invalid token');
    }
    return req;
}
};