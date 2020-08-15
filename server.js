const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
require('dotenv').config({
    path: './config/index.env'
});

// MongoDB
const connectDB = require('./config/db');
connectDB();

app.use(express.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cors());

app.get('/', (req, res) => {
    res.send('This is just a test route');
});

app.use('/api/user/', require('./routes/auth.route'));

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