const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
const ShopifyAPI = require('shopify-api-node');
const ShopifyToken = require('shopify-token');


const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const scopes = 'write_products, read_products, read_collection_listings';
const forwardingAddress = "https://728cea42.ngrok.io"; // Replace this with your HTTPS Forwarding address
// const nonceState = nonce();


// const shopify = new ShopifyAPI({
//     shop: 'ethkly-green.myshopify.com',
//     shopify_api_key: apiKey, // Your API key
//     shopify_shared_secret: apiSecret, // Your Shared Secret
//     shopify_scope: 'write_products, read_products, read_collection_listings',
//     redirect_uri: forwardingAddress + 'ethkly-green.myshopify.com',
//     nonce: nonceState
// })

app.get('/shopify', (req, res) => {
    const shop = req.query.shop;
    if (shop) {
        const state = nonce();
        const redirectUri = forwardingAddress + '/shopify/callback';
        //   const redirectUri = forwardingAddress + '/views/home';
        const installUrl = 'https://' + shop +
            '/admin/oauth/authorize?client_id=' + apiKey +
            '&scope=' + scopes +
            '&state=' + state +
            '&redirect_uri=' + redirectUri;

        res.cookie('state', state);
        res.redirect(installUrl);
    } else {
        return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
    }
});


// callback for redirect after install

app.get('/shopify/callback', (req, res) => {
    const { shop, hmac, code, state } = req.query;
    const stateCookie = cookie.parse(req.headers.cookie).state;

    if (state !== stateCookie) {
        return res.status(403).send('Request origin cannot be verified');
    }

    if (shop && hmac && code) {
        // DONE: Validate request is from Shopify
        const map = Object.assign({}, req.query);
        delete map['signature'];
        delete map['hmac'];
        const message = querystring.stringify(map);
        const providedHmac = Buffer.from(hmac, 'utf-8');
        const generatedHash = Buffer.from(
            crypto
                .createHmac('sha256', apiSecret)
                .update(message)
                .digest('hex'),
            'utf-8'
        );
        let hashEquals = false;

        try {
            hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
        } catch (e) {
            hashEquals = false;
        };

        if (!hashEquals) {
            return res.status(400).send('HMAC validation failed');
        }

        // DONE: Exchange temporary code for a permanent access token
        const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
        const accessTokenPayload = {
            client_id: apiKey,
            client_secret: apiSecret,
            code,
        };

        request.post(accessTokenRequestUrl, { json: accessTokenPayload })
            .then((accessTokenResponse) => {
                const accessToken = accessTokenResponse.access_token;
                // DONE: Use access token to make API call to 'shop' endpoint
                const productRequestUrl = 'https://' + shop + '/admin/products.json';
                const productRequestHeaders = {
                    'X-Shopify-Access-Token': accessToken,
                };

                let options = {
                    method: 'GET',
                    uri: productRequestUrl,
                    json: true,
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'content-type': 'application/json'
                    }
                }

                request(options)
                    .then(function (parsedBody) {

                        let filteredProducts = {
                            products: [{
                                clothingType: parsedBody.products[0].title,
                                description: parsedBody.products[0].body_html,
                                vendor: parsedBody.products[0].vendor
                            }, {
                                clothingType: parsedBody.products[1].title,
                                description: parsedBody.products[1].body_html,
                                vendor: parsedBody.products[1].vendor
                            }, {
                                clothingType: parsedBody.products[2].title,
                                description: parsedBody.products[2].body_html,
                                vendor: parsedBody.products[2].vendor
                            }, {
                                clothingType: parsedBody.products[3].title,
                                description: parsedBody.products[3].body_html,
                                vendor: parsedBody.products[3].vendor
                            }, {
                                clothingType: parsedBody.products[4].title,
                                description: parsedBody.products[4].body_html,
                                vendor: parsedBody.products[4].vendor
                            }

                            ]
                        }
                        console.log(parsedBody.products)
                        res.json(filteredProducts)
                    })
                    .catch(function (err) {
                        console.log(err)
                        res.json(err)
                    });

                // request.get(productRequestUrl, { 
                //     headers: productRequestHeaders,
                //     'content-type': 'application/json' 
                // })
                // .then(function (parsedBody){
                //     console.log(parsedBody.products[1].title)
                //     for(let i = 0; i < parsedBody.products.length; i++) {
                //         res.json(parsedBody.products[i].title)
                //     }
                // })
                // .catch(function(err){
                //     console.log(err)
                //     res.json(err)
                // });

                // request.get(productRequestUrl, { 
                //     headers: productRequestHeaders,
                //     'content-type': 'application/json' 
                // })
                //     .then((productResponse) => {
                //         res.status(200).end(productResponse);
                //     })
                //     .catch((error) => {
                //         res.status(error.statusCode).send(error.error.error_description);
                //     });

            })
            .catch((error) => {
                res.status(error.statusCode).send(error.error.error_description);
            });

    } else {
        res.status(400).send('Required parameters missing');
    }
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});


function getJson() {
    //take JSON data
        app.get('/shopify/callback'. (req, res) => {
            req.get()
        // get JSON data
}