const MiniExpress = require('./mini-express');
const app =  new MiniExpress();

const upperCaseBody = function(req, res, next) {
    if(req.body) {
        req.body = req.body.toUpperCase();
    }
    next();
}

const appendSmileToBody = function(req, res, next) {
    if(req.body) {
        req.body = req.body + ' :)';
    }
    next();
}

app.post('/todo', upperCaseBody, appendSmileToBody, (req, res) => {
    res.send(req.body);
    res.end('\nGET /todo');
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
});