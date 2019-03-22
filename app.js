const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';

const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const CONNECTION_URL = "mongodb+srv://localhost:5aWc9uynrdHL7yXY@denzel-iwohb.gcp.mongodb.net/test?retryWrites=true"
const DATABASE_NAME = "Denzel"

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({
    extended: true
}));

var database, collection;


app.listen(9292, () => {
    MongoClient.connect(CONNECTION_URL, {
        useNewUrlParser: true
    }, (error, client) => {
        if (error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("IMDB");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});


async function sandbox(actor) {
    try {
        console.log(`📽️  fetching filmography of ${actor}...`);
        return await imdb(actor);
    } catch (e) {
        console.error(e);
    }
}



app.get("/movies/populate", async (request, response) => {
    const movies = await sandbox(DENZEL_IMDB_ID);
    collection.insertMany(movies, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send({
            total: result.result.n
        });
    });
});

app.get("/movies", async (request, response) => {
    var query = {
        "metascore": {
            $gt: 70
        }
    }
    var count = await collection.countDocuments(query);
    var random = Math.floor(Math.random() * count);
    var option = {
        "limit": 1,
        "skip": random
    }
    collection.findOne(query, option, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send({
            "id": result.id,
            "link": result.link,
            "metascore": result.metascore,
            "poster": result.poster,
            "rating": result.rating,
            "synopsis": result.synopsis,
            "title": result.title,
            "votes": result.votes,
            "year": result.year

        });
    });
});
app.get("/movies/search", (request, response) => {

    var limit = 5;
    var metascore = 0;
    if (typeof parseInt(request.query.limit) !== 'undefined') limit = parseInt(request.query.limit);
    if (typeof parseInt(request.query.metascore) !== 'undefined') metascore = parseInt(request.query.metascore);

    var query = {
        "metascore": {
            $gte: metascore
        }
    };
    var option = {
        "limit": limit
    };

    collection.find(query, option).toArray((error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send({
            "limit": limit,
            "result": result,
            "status": response.status,
            "total": result.length
        });
    });
});

app.post("/movies/:id", (request, response) => {
    var date = request.body.date;
    var review = request.body.review;
    var query = {
        "id": request.params.id
    }
    var update = {
        $set: {
                "Thoughts.date": date,
                "Thoughts.review": review

        }
    };
    var option = {
        upsert: true
    };
    
    collection.findOneAndUpdate(query, update, option, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send({"_id" : result.value._id});
    });
});
app.get("/movies/:id", (request, response) => {
    collection.findOne({
        "id": (request.params.id)
    }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send({
            "id": result.id,
            "link": result.link,
            "metascore": result.metascore,
            "poster": result.poster,
            "rating": result.rating,
            "synopsis": result.synopsis,
            "title": result.title,
            "votes": result.votes,
            "year": result.year

        });
    });
});