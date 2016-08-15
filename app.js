/*
 * Arvind Kumar
 * arvind.kumar@msn.com
 */

var request = require('request-promise');
var express = require('express');
var app     = express();
var _       = require('lodash');
 
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/character/:name', (req, res) => {
    var name    = req.params.name;
    var baseURL = 'http://swapi.co/api/people/';
    
    getCharacterData(baseURL, name)
    .then((response) => {
        res.render('character', response);
    })
    .catch((err) => {
        res.send(err);
    });

    function getCharacterData(url, name) {
        return new Promise((resolve, reject) => {
            request(url)
            .then((body) => {
                if(!body) return reject('Couldn\'t fetch data!');

                name = name.toLowerCase();
                body = JSON.parse(body);
                var people = body.results;

                _.each(people, (character) => {
                    var charName = character.name.toLowerCase();
                    var isMatch  = charName === name || charName.split(' ').indexOf(name) > -1;
                    if(isMatch) {
                        return resolve(_.pick(character, ['name', 'gender', 'height', 'mass', 'birth_year']));
                    }
                });

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

app.get('/characters', function (req, res) {
    var base = 'http://swapi.co/api/people/';
    var urls = [base, base + '?page=2', base + '?page=3', base + '?page=4', base + '?page=5'];
    
    var all = urls.map(function (url) {
        return new Promise(function (resolve, reject) {
            request(url)
                .then(function (body) {
                    resolve(JSON.parse(body).results);
            });            
        });
    });

    Promise.all(all).then(function (response) {
        response = _.flatten(response);

        if('sort' in req.query) {
            res.send(_.sortBy(response, req.query.sort));
        } else {
            res.send(response);
        }
    })
});

app.get('/planetresidents', function (req, res) {
    function getData() {
        return new Promise(function(resolve, reject) {
            request('http://swapi.co/api/planets')
            .then(function (body) {
                var allPlanets = JSON.parse(body).results;
                _.each(allPlanets, function (planet) {
                    var planet = _.pick(planet, ['name', 'residents']);
                    var keyval = {};

                    var all = planet.residents.map(function (resident) {
                        return new Promise(function (resolve, reject) {
                            request(resident)
                            .then(function (body) {
                                resolve(JSON.parse(body).name);
                            });
                        })
                    });

                    Promise.all(all).then(function (residents) {
                        var response = {};
                        keyval[planet.name] = residents;
                        _.assign(response, keyval); 
                        resolve(response);
                    });
                });
            });
        });
    };

    getData().then(function (response) {
        res.send(response);
    });
})

var port = process.env.port || 3000;
app.listen(port, function () {
  console.log('app running at - http://localhost:' +port);
});