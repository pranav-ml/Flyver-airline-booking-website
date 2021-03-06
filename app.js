if (process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}

const express = require("express");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate"); 
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const dbUrl = process.env.URLDB || "mongodb://localhost:27017/flyver";
const User = require("./models/user");
const flightRoutes = require("./routes/flight");
const authRoutes = require("./routes/auth");

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection Error:"));
db.once("open", () => {
    console.log("Database Connected")
});

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true}));

const sessionConfig = {
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
}
app.use(session(sessionConfig));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    if (req.originalUrl !== "/login") req.session.returnTo = req.originalUrl;
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

app.use("/", flightRoutes);
app.use("/", authRoutes);

app.all('*', (req, res, next) => {
    res.redirect("/");
});

app.use((err, req, res, next) => {
    console.log(err.message);
    req.flash("error", "Oh No, Something Went Wrong!");
    res.redirect("/");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server live at '${port}'`);
});
