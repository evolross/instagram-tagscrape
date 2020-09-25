instagram-tagscrape
==============
NodeJS module for loading posts from Instagram by hashtag, individual post pages and locationpages without API access by means of scraping.

**Working on Instagram's public pages as of September 24th, 2020. NOTE: `scrapeLocationPage` has been commented out of `deepScrapeTagPage` to reduce requests.**

[![Build Status](https://travis-ci.org/evolross/instagram-tagscrape.svg?branch=master)](https://travis-ci.org/evolross/instagram-tagscrape)

## Disclamer
Instagram has gone to great lengths to prevent scraping and other unauthorized access to their public content. This module is dependant on the markup the public-facing instagram.com. Should that change this module might also stop working as intended. It also only loads the 17 posts that are displayed on first-load without following pagination to load more images. You should take this into consideration when deciding whether this module will work for you.

## Proxy Usage

This package has been updated to support an optional proxy to prevent getting blocked. For any kind of success at scale, it's recommended to use a proxy service (e.g. [scrapinghub.com](https://www.scrapinghub.com) that rotates proxy IPs. If you don't pass the `proxy` parameter, it will not use a proxy to make the request and will request from the server it's running on.

## Installation

`npm install evolross/instagram-tagscrape`

## Usage

The most basic usage will allow you to load the first 17 posts for any given hashtag with basic info and URLs to the full post media.

### Tag page scraping

```javascript
var ig = require('instagram-tagscrape');

ig.scrapeTagPage('bernie', 'http://someproxyurl.com:1234').then(function(result){
    console.dir(result);
})
```

Example response:

```json
{
    "total": 5854,
    "count": 17,
    "media": [{
        "code": "BMm39DKD6DB",
        "date": 1478733183,
        "dimensions": {
            "width": 750,
            "height": 750
        },
        "comments_disabled": false,
        "comments": {
            "count": 0
        },
        "caption": "Lorem ipsum... #quote #margaretmead #restmycase",
        "likes": {
            "count": 52
        },
        "owner": {
            "id": "393767493"
        },
        "thumbnail_src": "https://instagram.fosl1-1.fna.fbcdn.net/t51.2885-15/s640x640/sh0.08/e35/14719160_341462716214777_3017677686123266048_n.jpg?ig_cache_key=MTM4MDAzNjQyMzY3MTg0OTE1Mw%3D%3D.2",
        "is_video": false,
        "id": "1380036423671849153",
        "display_src": "https://instagram.fosl1-1.fna.fbcdn.net/t51.2885-15/s750x750/sh0.08/e35/14719160_341462716214777_3017677686123266048_n.jpg?ig_cache_key=MTM4MDAzNjQyMzY3MTg0OTE1Mw%3D%3D.2"
    }
    ....
}
```

As you can see, only the basic info required for listing images is returned. If you need further info, like more info about the owner of the post or the location, you can perform these queries separately or all in one go with the included `deepScrapeTagPage` method which populates the original tag page response with the corresponding data from the postPage and locationPage methods.

### Deep tag page scraping

This function will scrape each post return on the tag page for the passed tag. This can call up to 70 requests so a `limit` parameter has been added to limit this to reduce requests sent to Instagram. Passing null will cause it scrape all tags returned from the tag page.

```javascript
var ig = require('instagram-tagscrape');

ig.deepScrapeTagPage('bernie', optionalProxy, limit).then(function(result){
    console.dir(result);
})
```

The response from this call is so vast that to see what it contains I recommend you perform it and log out the result.

### Post page scraping

The post page scraping method takes a `code` argument (like the one returned for each post via the `scrapeTagPage`).

```javascript
var ig = require('instagram-tagscrape');

ig.scrapePostPage('BMm39DKD6DB', optionalProxy).then(function(result){
    console.dir(result);
})
```

### Location page scraping

**NOTE: This function is commented out of `deepScrapeTagPage` to reduce requests.**

The location page scraping method takes a numeric `id` argument (like the one returned for each post via the `scrapeTagPage`) and returns lat/lng coordinates for the post location among many other things.

```javascript
var ig = require('instagram-tagscrape');

ig.scrapeLocationPage(542401, optionalProxy).then(function(result){
    console.dir(result);
})
```
