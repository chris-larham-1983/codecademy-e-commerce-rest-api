const db = require('../db');
const express = require('express');

const registrationRouter = express.Router();

registrationRouter.post('/', (req, res, next) => {
    const { first_name, last_name, username, password, email, street_number, street_name, town, county, country, postcode } = req.body;
    db.query('WITH customer_insert AS ' +
        '(INSERT INTO customers (id, first_name, last_name, username, password, email) ' +
        'VALUES ((SELECT GREATEST(0, (SELECT MAX(id) FROM customers))) + 1, $1, $2, $3, $4, $5) ' +
        'RETURNING id) ' +
        'INSERT INTO addresses (id, street_number, street_name, town, county, country, postcode, customer_id) ' +
        'VALUES ((SELECT GREATEST(0, (SELECT MAX(id) FROM addresses))) + 1, $6, $7, $8, $9, $10, $11, (SELECT id FROM customer_insert))',
        [first_name, last_name, username, password, email, street_number, street_name, town, county, country, postcode],
        (err, result) => {
                if(err) {
                    return next(err);
                }
                else {
                    res.send('Your customer profile has been created successfully.');
                }
    });
});

module.exports = registrationRouter;