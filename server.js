const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
require('dotenv').config({
    path: './config/index.env'
});

app.use(express.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cors());

app.get('/', (req, res) => {
    res.send('This is just a test route');
});

// Error 404
app.use((req, res, next) => {
    return res.status(404).json({
        msg: 'Page not found'
    })
})

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log('App running on port ' + PORT);
});