var express = require('express');
var graphqlHTTP = require('express-graphql');

const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';

const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const CONNECTION_URL = "mongodb+srv://localhost:5aWc9uynrdHL7yXY@denzel-iwohb.gcp.mongodb.net/test?retryWrites=true"
const DATABASE_NAME = "Denzel"

var {
    buildSchema
} = require('graphql');

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type Query {
    Populate : String
    Random : Movie
    getMovie(id:String) : Movie
    getMovies(metascore:Int, limit:Int):[Movie]
    postReview(id:String, review:Review): Movie
  },
  type Movie {
    link: String
    metascore: Int
    synopsis: String
    title: String
    year: Int
  },
  type Populate {
    total : String
  },
  input Review {
    date: String
    review : String
  }
`);

// The root provides a resolver function for each API endpoint
var root = {
    Populate: async (source, args) => {
        const movies = await sandbox(DENZEL_IMDB_ID);
        const insertion = collection.insertMany(movies);
        return {
            total: insertion.movie.n
        };
    },
    Random: async () => {
        var query = {
            "metascore": {
                $gte: 70
            }
        }
        var count = await collection.countDocuments(query);
        var random = Math.floor(Math.random() * count);
        var option = {
            "limit": 1,
            "skip": random
        }
        var movie = await collection.findOne(query, option)
        return movie;
    },
    getMovie: async (args) => {
        const movie = await collection.findOne({
          "id": args.id
        });
        return movie;
      },
    getMovies :async(args)=>{
        var query = {
            "metascore":{
                $gte:args.metascore
            }
        };
        var option = {
            "limit":args.limit,
            "sort":[["metascore","desc"]]
        };
        var movies = await collection.find(query,option).toArray();
        return movies;
    },
    postReview:async(args)=>{
        var id={
            "id":args.id
        };
        var document ={
            $set:args.review
        };
        var option ={
            "upsert":true
        };
        var post = await collection.updateMany(id,document,option);
        var docPost = await collection.find(id);
        return docPost;

    }
};

var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));

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


console.log('Running a GraphQL API server at localhost:9292/graphql');

async function sandbox(actor) {
    try {
        console.log(`📽️  fetching filmography of ${actor}...`);
        return await imdb(actor);
    } catch (e) {
        console.error(e);
    }
}