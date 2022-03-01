require('dotenv').config({ path: './db/.env'});

const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const db = require('./db/index.js');
const engine = require('express-handlebars'); //use the 'express-handlebars' package to render views
const path = require('path');

const productsRouter = require('./routes/products');
const customersRouter = require('./routes/customers');
const registrationRouter = require('./routes/registration');
const loginRouter = require('./routes/login');
const loginFailureRouter = require('./routes/loginFailure');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const addressesRouter = require('./routes/addresses');

//configure the Handlebars view engine
app.engine('handlebars', engine.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.static('public'));

const PORT = process.env.PORT || 4001;

// Body-parsing Middleware
app.use(bodyParser.json());

// Support encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Logging Middleware
if (!process.env.IS_TEST_ENV) {
    app.use(morgan('dev'));
}

// Serve static content in the production environment
if(process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, "views")));
}

//render the homepage view when the app is loaded
app.get('/', (req, res) => {
    res.render('home');
});

//use 'loginRouter' at the '/login' route
app.use('/login', loginRouter);

//use 'loginFailureRouter' at the '/loginFailure' route
app.use('/loginFailure', loginFailureRouter);

//use 'productsRouter' at the '/api/products' route
app.use('/api/products', productsRouter);

//use 'customersRouter' at the '/api/customers' route
app.use('/api/customers', customersRouter);

//use 'registrationRouter' at the '/api/registration' route
app.use('/api/registration', registrationRouter);

//use 'cartRouter' at the '/api/cart' route
app.use('/api/cart', cartRouter);

//use 'ordersRouter' at the '/api/orders' route
app.use('/api/orders', ordersRouter);

//use 'addressesRouter' at the '/api/addresses' route
app.use('/api/addresses', addressesRouter);

// error handling:
app.use((err, req, res, next) => {
    if(err.message === `Customer does not exist in the database.`) {
        res.status(404).send(err.message);
    } else if(err.message === 'No address is associated with this customer id.') {
        res.status(404).send(err.message);
    } else if(err.message === 'This address is not associated with this customer id.') {
        res.status(404).send(err.message);
    } else if(err.message === 'No orders belonging to the specified customer were found in the database.') {
        res.status(404).send(err.message);
    } else if(err.message === 'No association of the specified customer ID and order ID exists in the database.') {
        res.status(404).send(err.message);
    } else if(err.message === 'No product with the specified ID found in the database.') {
        res.status(404).send(err.message);
    } else if (err.message === 'duplicate key value violates unique constraint "customers_username_key"') { //if a non-unique username has been selected by the customer
        res.status(500).send('The username you have selected is already in use. Please choose a different username.'); //send an informative message back to the customser
    } else if (err.message === 'duplicate key value violates unique constraint "customers_password_key"') {//if a non-unique password has been selected by the customer
        res.status(500).send('The password you have selected is already in use. Please choose a different password.'); //send an informative message back to the customer
    } else if(err.message === 'duplicate key value violates unique constraint "customers_email_unique"') { //if a non-unique email address has been selected by the customer
        res.status(500).send('The email address you have selected is already in use. Please choose a different email address.'); //send an informative message back to the customer
    } else if(err.message === 'duplicate key value violates unique constraint "products_image_url_key"') { //if an attempt to insert a non-unique image URL into the 'products' table has been made
        res.status(409).send('Product creation did not succeed because the image URL is already in use.'); //send a message stating that the image URL is already in use
    } else if(err.message === 'Your shopping cart is empty.') {
        res.status(404).send(err.message);
    } else if(err.message === 'insert or update on table "cart" violates foreign key constraint "cart_customer_id_fkey"') {
        res.status(400).send('There is no record of a customer with the specified \'customerId\' in the database.');
    } else if(err.message === 'null value in column "product_name" of relation "cart" violates not-null constraint') {
        res.status(404).send('There is no record of a product with the specified \'productId\' in the database.');
    }
    else {
        res.status(500).send(err.message);
    }
});

// 'catchall' method if the user navigates to a route that is not defined above - the user gets redirected to the last valid route in the entered URL
app.get('*', (req, res) => {
    res.redirect('../');
});

//start the server listening on the appropriate port
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

