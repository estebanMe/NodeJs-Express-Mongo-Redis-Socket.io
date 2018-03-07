var express = require('express');
var bodyParser = require('body-parser');
var User = require('./models/user').User;
var session = require('express-session');
var router_app = require('./routes_app');
var session_middleware = require('./middleware/session');
var methodOverride = require('method-override');
var formidable = require("express-form-data");
var RedisStore = require('connect-redis')(session);
var http = require("http");
var realtime = require("./realtime");


var app = express();
var server = require('http').createServer(app)

var sessionMiddleware = session({
    store: new RedisStore({}), // connect-mongo session store
    proxy: true,
    resave: true,
    saveUninitialized: true,
    secret: "super secreto"
});

realtime(server, sessionMiddleware)

app.use("/public", express.static('public'));

app.use(bodyParser.json()); //para peticiones aplicaction/json
app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride("_method"));




//session con express-session
app.use(sessionMiddleware);

app.use(formidable.parse({ keepExtensions: true }))




//template jade que obtiene del folder views
app.set("view engine", "jade");


//Route app

app.get("/", function(req, res) {
    console.log(req.session.user_id);
    res.render("index");
});

app.get("/signup", function(req, res) {
    User.find(function(err, doc) {
        console.log(doc)
        res.render("signup");
    });
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/users", function(req, res) {
    var user = new User({
        email: req.body.email,
        password: req.body.password,
        password_confirmation: req.body.password_confirmation,
        username: req.body.username
    });

    // Implementando promise
    user.save().then(function(us) {
        res.send('Guardamos el usuario correctamente');
    }, function(err) {
        if (err) {
            console.log(String(err));
            res.send('No pudimos guardar la información');
        }
    });
});

app.post("/session", function(req, res) {
    User.findOne({ email: req.body.email, password: req.body.password }, function(err, user) {
        req.session.user_id = user._id;
        res.redirect("/app");
    });
});

app.use("/app", session_middleware);
app.use("/app", router_app);

server.listen("8080");