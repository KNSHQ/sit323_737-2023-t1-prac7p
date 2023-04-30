const express = require('express');

const bodyParser = require('body-parser');

const passport = require('passport');

const LocalStrategy = require('passport-local').Strategy;

const JwtStrategy = require('passport-jwt').Strategy;

const ExtractJwt = require('passport-jwt').ExtractJwt;

const jwt = require('jsonwebtoken');

const port = 3000;

const app = express();

// Setup body-parser middleware to parse JSON data
app.use(bodyParser.json());

const winston = require('winston');

const {
	combine,
	timestamp,
	label,
	printf
} = winston.format;

const myFormat = printf(({
	level,
	message,
	label,
	timestamp
}) => {
	return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = winston.createLogger({
	level: 'info',
	format: combine(
		label({ label: 'calculator-microservice' }),
		timestamp(),
		myFormat
		),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
		new winston.transports.File({ filename: 'logs/combined.log' })
	]
});

const users = [{
	username: 'user1',
	password: 'pass1'
}, {
	username: 'user2',
	password: 'pass2'
}];

const jwtSecret = 'secret';

// Setup passport JWT options
const jwtOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: jwtSecret
};

passport.use(new LocalStrategy((username, password, done) => {
	const user = users.find(u => u.username === username && u.password === password);
	if (user) {
		done(null, user);
	} else {
		done(null, false);
	}
}));

// Use passport middleware and Setup passport JWT strategy
passport.use(new JwtStrategy(jwtOptions, (payload, done) => {
	const user = users.find(u => u.username === payload.username);
	if (user) {
		done(null, user);
	} else {
		done(null, false);
	}
}));

// Define authentication middleware
const authenticate = passport.authenticate('jwt', {
	session: false
});

// Define authorization middleware
const authorize = (req, res, next) => {
	const user = req.user;
	if (user.username === 'user1') {
		next();
	} else {
		logger.error('Unauthorized request');
		res.status(401).send('Unauthorized');
	}
};

// Define API endpoints

// Set up a route to serve the frontend
app.use(express.static('public'));

// Define a route handler for the root URL
app.get('/', (req, res) => {

	// Send the HTML file to the client
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	const user = users.find(u => u.username === username && u.password === password);
	if (user) {
		const token = jwt.sign({ username: user.username }, jwtSecret);
		res.send({ token });
	} else {
		logger.error('Unauthorized request');
		res.status(401).send('Unauthorized');
	}
});

app.get('/add', authenticate, authorize, (req, res) => {
	const num1 = parseFloat(req.query.num1);
	const num2 = parseFloat(req.query.num2);
	if (isNaN(num1) || isNaN(num2)) {
		logger.error('Invalid input for addition operation');
		res.status(400).send('Invalid input');
	} else {
		const result = num1 + num2;
		logger.log('info', `Addition operation: ${num1} + ${num2} = ${result}`);
		res.send(`${num1} + ${num2} = ${result}`);
	}
});

app.get('/subtract', authenticate, (req, res) => {
	const num1 = parseFloat(req.query.num1);
	const num2 = parseFloat(req.query.num2);
	if (isNaN(num1) || isNaN(num2)) {
		logger.error('Invalid input for subtraction operation');
		res.status(400).send('Invalid input');
	} else {
		const result = num1 - num2;
		logger.log('info', `Subtraction operation: ${num1} - ${num2} = ${result}`);
		res.send(`${num1} - ${num2} = ${result}`);
	}
});

app.get('/multiply', authenticate, (req, res) => {
	const num1 = parseFloat(req.query.num1);
	const num2 = parseFloat(req.query.num2);
	if (isNaN(num1) || isNaN(num2)) {
		logger.error('Invalid input for subtraction operation');
		res.status(400).send('Invalid input');
	} else {
		const result = num1 * num2;
		logger.log('info', `Subtraction operation: ${num1} - ${num2} = ${result}`);
		res.send(`${num1} * ${num2} = ${result}`);
	}
});

app.get('/divide', authenticate, (req, res) => {
	const num1 = parseFloat(req.query.num1);
	const num2 = parseFloat(req.query.num2);
	if (isNaN(num1) || isNaN(num2)) {
		logger.error('Invalid input for division operation');
		res.status(400).send('Invalid input');
	} else if (num2 === 0) {
		logger.error('Division by zero error');
		res.status(400).send('Division by zero error');
	} else {
		const result = num1 / num2;
		logger.log('info', `Division operation: ${num1} / ${num2} = ${result}`);
		res.send(`${num1} / ${num2} = ${result}`);
	}
});

// Health endpoint
app.get('/health', (req, res) => {
	res.status(200).send('OK');
});

app.listen(port, () => {
	console.log(`Calculator microservice listening at http://localhost:${port}`);
});