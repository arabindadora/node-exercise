/*
 * Arvind Kumar
 * arvind.kumar@msn.com
 */
"use strict";

const request = require('request-promise');
const express = require('express');
const app     = express();
const _       = require('lodash');

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/character/:name', (req, res) => {
    let name  = req.params.name;
    const url = 'http://swapi.co/api/people/';

    getCharacterData(url, name)
    .then((response) => {
        res.render('character', response);
    })
    .catch((err) => {
        res.send(err);
    });

    function getCharacterData(url, name) {
        return new Promise((resolve, reject) => {
            request(url).then((body) => {
                if(!body) return reject('Couldn\'t fetch data!');

                name = name.toLowerCase();
                body = JSON.parse(body);
                const people = body.results;

                // use vanilla forloop as _.each still runs even after returning
                for(let i=0, l=people.length; i < l; i++) {
                    const character = people[i];
                    const charName  = character.name.toLowerCase(); // lowerCase as the request data could be in any case
                    // match full name or first/middle/last name as request data could contain any of these
                    const isMatch   = charName === name || charName.split(' ').indexOf(name) > -1;

                    // if said character is found, return desired data
                    if(isMatch) {
                        return resolve(_.pick(character, ['name', 'gender', 'height', 'mass', 'birth_year']));
                    }
                }

                if (!body.next || body.next === null) {
                    return reject(`No match found for ${name}!`);
                }

                getCharacterData(body.next, name)
                .then((response) => {
                    resolve(response);
                })
                .catch((err) => {
                    reject(err);
                });
            });
        });
    }
});

app.get('/characters', (req, res) => {
    const base = 'http://swapi.co/api/people/';
    const urls = [base, base + '?page=2', base + '?page=3', base + '?page=4', base + '?page=5'];

    const all = urls.map((url) => {
        return new Promise((resolve, reject) => {
            request(url).then((body) => {
                resolve(JSON.parse(body).results);
            });
        });
    });

    Promise.all(all).then((response) => {
        response = _.flatten(response);

        if('sort' in req.query) {
            res.send(_.sortBy(response, req.query.sort));
        } else {
            res.send(response);
        }
    })
});

app.get('/planetresidents', (req, res) => {
    getData().then((response) => {
        res.send(response);
    }).catch((err) => {
        res.send(err);
    });

    function getData() {
        return new Promise((resolve, reject) => {
            const url = 'http://swapi.co/api/planets';

            request(url).then((body) => {
                let response      = {};
                let responseCount = 0;
                const allPlanets  = JSON.parse(body).results;
                const planetCount = Object.keys(allPlanets).length;

                _.each(allPlanets, (planet) => {
                    let keyval = {};
                    planet = _.pick(planet, ['name', 'residents']);

                    const all = planet.residents.map((resident) => {
                        return new Promise((resolve, reject) => {
                            request(resident).then((body) => {
                                resolve(JSON.parse(body).name);
                            });
                        })
                    });

                    Promise.all(all).then((residents) => {                        
                        keyval[planet.name] = residents;
                        _.extend(response, keyval);
                        
                        responseCount = Object.keys(response).length;
                        if(responseCount === planetCount) {
                            resolve(response);
                        }
                    });
                });
            });
        });
    };
})

const port = process.env.port || 3000;
app.listen(port, () => {
    console.log('app running at - http://localhost:' +port);
});