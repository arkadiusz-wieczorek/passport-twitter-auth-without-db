const express = require("express");
const passport = require("passport");
const Strategy = require("passport-twitter").Strategy;

passport.use(
	new Strategy(
		{
			consumerKey: process.env.CONSUMER_KEY,
			consumerSecret: process.env.CONSUMER_SECRET,
			callbackURL: "http://127.0.0.1:3000/login/twitter/return",
		},
		(token, tokenSecret, profile, callback) => callback(null, profile)
	)
);

passport.serializeUser((user, done) => done(null, user));

passport.deserializeUser((user, done) => {
	findUserByIdMock(user, done);
});

const findUserByIdMock = (user, done) => {
	if (process.env.USER_ID == user.id) done(null, user);
	else done(null, false);
};

const app = express();

// Configure view engine to render EJS templates.
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// Use application-level middleware for common functionality, including logging, parsing, and session handling.
app.use(require("morgan")("combined"));
app.use(require("cookie-parser")());
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(
	require("express-session")({
		secret: "keyboard cat",
		resave: true,
		saveUninitialized: true,
	})
);

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// Define routes.
app.get("/", (req, res) => res.render("home", { user: req.user }));

app.get("/login", (req, res) => res.render("login"));

app.get("/login/twitter", passport.authenticate("twitter"));
app.get(
	"/login/twitter/return",
	passport.authenticate("twitter", { failureRedirect: "/login" }),
	(req, res) => {
		res.redirect("/");
	}
);

app.get(
	"/profile",
	require("connect-ensure-login").ensureLoggedIn(),
	(req, res) => {
		res.render("profile", { user: req.user });
	}
);

app.listen(3000);
