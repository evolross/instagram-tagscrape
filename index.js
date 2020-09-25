var request = require('request'),
    Promise = require('bluebird'),
    listURL = 'https://www.instagram.com/explore/tags/',
    postURL = 'https://www.instagram.com/p/',
    locURL  = 'https://www.instagram.com/explore/locations/',
    dataExp = /window\._sharedData\s?=\s?({.+);<\/script>/

/*exports.promiseTimeout = function(time){
    return new Promise(function(resolve, reject){
        setTimeout(function(){
            resolve();
        }, time);
    });
}*/

exports.deepScrapeTagPage = function(tag, proxy, limit) {

    console.log("instagram-tagscrape: deepScrapeTagPage: tag, proxy, limit: ", tag, proxy, limit);
    //console.log("instagram-tagscrape: deepScrapeTagPage: process.env.NODE_ENV: ", process.env.NODE_ENV);

    return new Promise(function(resolve, reject) {
        exports.scrapeTagPage(tag, proxy).then(function(tagPage) {

            //  Limit tagPage.media (if no limit it can return up to 70 posts)
            if(limit)
                tagPage.media = tagPage.media.splice(0, limit);

            return Promise.map(tagPage.media, function(media, i, len) {

                //  Added a timeout here to try to reduce rate-limiting errors                
                //return exports.promiseTimeout(1500 * (i + 1)).then(function(result) {

                    return exports.scrapePostPage(media.node.shortcode, proxy).then(function(postPage) {

                        //  Add the result to the media array
                        tagPage.media[i] = postPage;

                        //  Location page now requires a login as of 08/16/19. Commenting out for now to hide errors.
                        //  As of 06/02/20 it looks like it no longer requires a login but the app is hitting rate-limiting issues
                        //  so leaving this commented out anyway. FYI - tho.
                        /*if (postPage.location != null && postPage.location.has_public_page) {
                            return exports.scrapeLocationPage(postPage.location.id).then(function(locationPage){
                                tagPage.media[i].location = locationPage;
                            })
                            .catch(function(err) {
                                console.log("An error occurred calling scrapeLocationPage inside deepScrapeTagPage" + ":" + err);
                            });
                        }*/
                    })
                //})
                .catch(function(err) {
                    console.log("instagram-tagscrape: An error occurred calling scrapePostPage inside deepScrapeTagPage" + ":" + err);
                });
            })
            .then(function(){ resolve(tagPage); })
            .catch(function(err) {
                console.log("instagram-tagscrape: An error occurred resolving tagPage inside deepScrapeTagPage" + ":" + err);
            });
        })
        .catch(function(err) {
                console.log("instagram-tagscrape: An error occurred calling scrapeTagPage inside deepScrapeTagPage" + ":" + err);
        });        
    });
};

exports.scrapeTagPage = function(tag, proxy) {

    //console.log("instagram-tagscrape: scrapeTagPage: tag, proxy: ", tag, proxy);

    return new Promise(function(resolve, reject) {
        if (!tag) return reject(new Error('Argument "tag" must be specified'));

        //  Now create a dynmaic requestParams object that dynamically passes if this is production. If not, it allows
        //  https requests to return unauthorized. And we also dynamically add the proxy if it exists
        let requestParams = {
            uri: listURL + tag,
            rejectUnauthorized: false  //process.env.NODE_ENV != 'production' ? false : true
        }

        if(proxy)
            requestParams.proxy = proxy;

        request(requestParams, function(err, response, body) {

            //console.log("instagram-tagscrape: response: ", response);
            //console.log("instagram-tagscrape: body: ", body);

            if(err) {
                console.log("instagram-tagscrape: scrapeTagPage: err: ", err);
                return reject(err);
            }

            let data = scrape(body)

            if (data && data.entry_data && 
                data.entry_data.TagPage &&
                data.entry_data.TagPage[0] && 
                data.entry_data.TagPage[0].graphql &&
                data.entry_data.TagPage[0].graphql.hashtag &&
                data.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media &&
                data.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media.edges) {                
                let edge_hashtag_to_media = data.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media;
                resolve({
                    total: edge_hashtag_to_media.count,
                    count: edge_hashtag_to_media.edges.length,
                    media: edge_hashtag_to_media.edges
                });
            }
            else {
                reject(new Error('Error scraping tag page or no pages found "' + tag + '"'));
            }
        })
    });
};

exports.scrapePostPage = function(code, proxy) {

    //console.log("instagram-tagscrape: scrapePostPage: code, proxy: ", code, proxy);

    return new Promise(function(resolve, reject) {
        if (!code) return reject(new Error('Argument "code" must be specified'));

        //  Now create a dynmaic requestParams object that dynamically passes if this is production. If not, it allows
        //  https requests to return unauthorized. And we also dynamically add the proxy if it exists
        let requestParams = {
            uri: postURL + code,
            rejectUnauthorized: false  //process.env.NODE_ENV != 'production' ? false : true
        }

        if(proxy)
            requestParams.proxy = proxy;

        request(requestParams, function(err, response, body) {

            if(err) {
                console.log("instagram-tagscrape: scrapePostPage: err: ", err);
                return reject(err);
            }

            let data = scrape(body);

            if (data && data.entry_data && 
                data.entry_data.PostPage &&
                data.entry_data.PostPage[0] && 
                data.entry_data.PostPage[0].graphql && 
                data.entry_data.PostPage[0].graphql.shortcode_media) {
                resolve(data.entry_data.PostPage[0].graphql.shortcode_media); 
            }
            else {
                reject(new Error('Error scraping post page or no posts found "' + code + '"'));
            }
        });
    });
}

exports.scrapeLocationPage = function(id, proxy) {

    //console.log("instagram-tagscrape: scrapeLocationPage: id, proxy: ", id, proxy);

    return new Promise(function(resolve, reject) {
        if (!id) return reject(new Error('Argument "id" must be specified'));

        //  Now create a dynmaic requestParams object that dynamically passes if this is production. If not, it allows
        //  https requests to return unauthorized. And we also dynamically add the proxy if it exists
        let requestParams = {
            uri: locURL + id,
            rejectUnauthorized: false  //process.env.NODE_ENV != 'production' ? false : true
        }

        if(proxy)
            requestParams.proxy = proxy;
        
        request(requestParams, function(err, response, body) {

            if(err) {
                console.log("instagram-tagscrape: scrapeLocationPage: err: ", err);
                return reject(err);
            }
            
            let data = scrape(body);

            if (data && data.entry_data && 
                data.entry_data.LocationsPage &&
                data.entry_data.LocationsPage[0] && 
                data.entry_data.LocationsPage[0].graphql && 
                data.entry_data.LocationsPage[0].graphql.location) {
                resolve(data.entry_data.LocationsPage[0].graphql.location);
            }
            else {
                reject(new Error('Error scraping location page or no locations found "' + id + '"'));
            }
        });
    });
}

var scrape = function(html) {

    //console.log("instagram-tagscrape: html: ", html);
    let htmlMatch;
    let dataString;
    let json;

    try {
        htmlMatch = html.match(dataExp);
        if(htmlMatch) {
            dataString = htmlMatch[1];
            //console.log("instagram-tagscrape: scrape: dataString: ", dataString);
            json = JSON.parse(dataString);
        }
        else
            console.log("instagram-tagscrape: scrape: The HTML returned from Instagram was not suitable for scraping and/or the request was blocked.");
    }
    catch(e) {
        console.log("instagram-tagscrape: scrape: Error: ", e);
        return null;
    }

    return json;
}