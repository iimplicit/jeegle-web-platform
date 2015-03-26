/*****************************************************************************/
/* Home: Event Handlers */
/*****************************************************************************/
Template.Home.events({
    "click [data-login]": function() {
        Meteor.loginWithFacebook();
    },
    "click [data-logout]": function() {
        Meteor.logout();
    },
    "submit form": function(e, tmpl) {
        e.preventDefault();
        var query = tmpl.find('input').value;
        tmpl.find('form').reset();
    },
    "keyup input": function(e, tmpl) {
        e.preventDefault();
        var query = tmpl.find('input').value;
        var basicQuery = {
            query: {
                match: {
                    tags: query
                }
            }
        };
        $.ajax("http://128.199.249.209:9200/jeegle/Images/_search", {
            type: "POST",
            data: JSON.stringify(basicQuery),
            success: function(data) {
                Session.set("images", data.hits.hits);
                console.dir(data.hits.hits);
            },
            error: function() {

            }
        });
    },
    "click [data-image-item]": function(e, tmpl) {
        var background = e.target.style.background;
        var url = background.slice(4, background.length - 1);
        Session.set("mainImage", url);
    }
});

/*****************************************************************************/
/* Home: Helpers */
/*****************************************************************************/
Template.Home.helpers({
    images: function() {
        return Session.get("images");
    },
    mainImage: function() {
        return Session.get("mainImage");
    }
});

/*****************************************************************************/
/* Home: Lifecycle Hooks */
/*****************************************************************************/
Template.Home.created = function() {

};

Template.Home.rendered = function() {
    Session.set("images", [{
        "_index": "jeegle",
        "_type": "Images",
        "_id": "wMhTihYSvyumNjnb9",
        "_score": 1,
        "_source": {
            "tags": [
                "fallen trees",
                "forest",
                "lumber",
                "material",
                "stack",
                "stacked",
                "tree trunks",
                "wood"
            ],
            "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/fallen-trees-forest-stack-1045.jpg",
            "_id": "wMhTihYSvyumNjnb9",
            "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/fallen-trees-forest-stack-1045-821x550.jpg"
        }
    }, {
        "_index": "jeegle",
        "_type": "Images",
        "_id": "N2u4Hy6WXnNML5H4m",
        "_score": 1,
        "_source": {
            "tags": [
                "building",
                "city",
                "closely",
                "fire escape",
                "fire ladder",
                "house",
                "skyscraper"
            ],
            "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/city-closely-fire-ladder-1070.jpg",
            "_id": "N2u4Hy6WXnNML5H4m",
            "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/city-closely-fire-ladder-1070-901x550.jpg"
        }
    }, {
        "_index": "jeegle",
        "_type": "Images",
        "_id": "ckpa7xMFkFJ3XywTF",
        "_score": 1,
        "_source": {
            "tags": [
                "buildings",
                "city",
                "sepia",
                "skyscrapers",
                "streets",
                "urban",
                "view"
            ],
            "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/buildings-city-sepia-1054.jpg",
            "_id": "ckpa7xMFkFJ3XywTF",
            "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/buildings-city-sepia-1054-733x550.jpg"
        }
    }, {
        "_index": "jeegle",
        "_type": "Images",
        "_id": "sQh3penvNxbpeHKFM",
        "_score": 1,
        "_source": {
            "tags": [
                "animal",
                "eye",
                "horse",
                "poney"
            ],
            "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/animal-eye-horse-1027.jpg",
            "_id": "sQh3penvNxbpeHKFM",
            "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/animal-eye-horse-1027-825x550.jpg"
        }
    }, {
        "_index": "jeegle",
        "_type": "Images",
        "_id": "LxuEmvfK35DEd2rFc",
        "_score": 1,
        "_source": {
            "tags": [
                "amour",
                "couple",
                "date",
                "feelings",
                "hug",
                "hugging",
                "kissing",
                "love",
                "lovers",
                "people",
                "romantic",
                "sun",
                "together"
            ],
            "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/couple-kissing-love-1075.jpg",
            "_id": "LxuEmvfK35DEd2rFc",
            "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/couple-kissing-love-1075-825x550.jpg"
        }
    }, {
        "_index": "jeegle",
        "_type": "Images",
        "_id": "ZNZkfjTnDAGJWQfuC",
        "_score": 1,
        "_source": {
            "tags": [
                "broken",
                "dangerous",
                "jetty",
                "lake",
                "landing stage",
                "pontoon",
                "risky",
                "sea",
                "wood"
            ],
            "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/broken-dangerous-lake-1087.jpg",
            "_id": "ZNZkfjTnDAGJWQfuC",
            "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/broken-dangerous-lake-1087-849x550.jpg"
        }
    }, {
        "_index": "jeegle",
        "_type": "Images",
        "_id": "NmSyGbpcwXkoWBPZQ",
        "_score": 1,
        "_source": {
            "tags": [
                "creepy",
                "curve",
                "dark",
                "fog",
                "foggy",
                "forest",
                "railroad",
                "rails",
                "railway",
                "scary"
            ],
            "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/creepy-curve-dark-1096.jpg",
            "_id": "NmSyGbpcwXkoWBPZQ",
            "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/creepy-curve-dark-1096-824x550.jpg"
        }
    }, {
        "_index": "jeegle",
        "_type": "Images",
        "_id": "rCtu9kTNXwegNqabx",
        "_score": 1,
        "_source": {
            "tags": [
                "lake",
                "landscape",
                "mountains",
                "nature",
                "sky",
                "snow",
                "winter"
            ],
            "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/lake-landscape-mountains-1130.jpg",
            "_id": "rCtu9kTNXwegNqabx",
            "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/lake-landscape-mountains-1130-825x550.jpg"
        }
    }, {
        "_index": "jeegle",
        "_type": "Images",
        "_id": "HLcQKMDZWH8jTDcDi",
        "_score": 1,
        "_source": {
            "tags": [
                "candle",
                "fire",
                "flame",
                "hearts"
            ],
            "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/candle-fire-flame-1095.jpg",
            "_id": "HLcQKMDZWH8jTDcDi",
            "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/candle-fire-flame-1095-825x550.jpg"
        }
    }, {
        "_index": "jeegle",
        "_type": "Images",
        "_id": "MvLdugP43CdpCpYyE",
        "_score": 1,
        "_source": {
            "tags": [
                "apple",
                "computer",
                "desk",
                "device",
                "imac",
                "keyboard",
                "magic mouse",
                "technology",
                "workspace",
                "workstation"
            ],
            "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/apple-imac-keyboard-1149.jpg",
            "_id": "MvLdugP43CdpCpYyE",
            "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/apple-imac-keyboard-1149-825x550.jpg"
        }
    }]);

    Session.set("mainImage", "http://static.pexels.com/wp-content/uploads/2014/06/fallen-trees-forest-stack-1045-821x550.jpg");
};

Template.Home.destroyed = function() {};