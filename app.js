const express = require('express');
const app = express();
const port = 3000;
// Library that allows you to make a put and delete request
const methodOverride = require('method-override');
// Function that will be called in async functions
const catchAsync = require('./helpers/catchAsync');
const ExpressError = require('./helpers/ExpressError');
const { campgroundSchema, reviewSchema } = require('./schemas');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Get the current directory
const path = require('path');
const ejsMate = require('ejs-mate');

app.engine('ejs', ejsMate);
// Import ejs
app.set('view engine', 'ejs');
// Replace the current directory where the files are located with /views path
app.set('views', path.join(__dirname, 'views'));

const mongoose = require('mongoose');
// Create connection
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error'));
db.once('open', () => console.log('database open'));

// * Import models
const Campground = require('./models/campground');
const Review = require('./models/review');

// ? Validations
const validateCampground = (req, res, next) => {
	const { error } = campgroundSchema.validate(req.body);
	if (error) {
		const msg = error.details.map((el) => el.message).join(',');
		throw new ExpressError(msg, 400);
	} else {
		next();
	}
};
const validateReview = (req, res, next) => {
	const { error } = reviewSchema.validate(req.body);
	if (error) {
		const msg = error.details.map((el) => el.message).join(',');
		throw new ExpressError(msg, 400);
	} else {
		next();
	}
};

// main page
app.get('/', (req, res) => {
	res.render('home');
});
//list of campgrounds
app.get('/campgrounds', async (req, res) => {
	const campgrounds = await Campground.find({});
	res.render('campgrounds/index', { campgrounds });
});
//create new camp
app.get('/campgrounds/new', (req, res) => {
	res.render('campgrounds/new');
});
app.post(
	'/campgrounds',
	validateCampground,
	catchAsync(async (req, res, next) => {
		let campground = new Campground(req.body.campground);
		await campground.save();
		res.redirect(`/campgrounds/${campground._id}`);
	})
);
//Get a specific campground by its id
app.get(
	'/campgrounds/:id',
	catchAsync(async (req, res) => {
		const campground = await Campground.findById(req.params.id).populate(
			'reviews'
		);
		if (!campground) throw new ExpressError('No campground found', 400);
		res.render('campgrounds/show', { campground });
	})
);
//Get a specific campground by its id to edit it
app.get(
	'/campgrounds/:id/edit',
	catchAsync(async (req, res) => {
		const campground = await Campground.findById(req.params.id);
		if (!campground) throw new ExpressError('No campground found', 400);
		res.render('campgrounds/edit', { campground });
	})
);
app.put(
	'/campgrounds/:id',
	validateCampground,
	catchAsync(async (req, res) => {
		let { id } = req.params;
		let campground = await Campground.findByIdAndUpdate(id, {
			// spread operator
			...req.body.campground,
		});
		res.redirect(`/campgrounds/${campground._id}`);
	})
);

app.delete(
	'/campgrounds/:id',
	catchAsync(async (req, res) => {
		let { id } = req.params;
		await Campground.findByIdAndDelete(id);
		res.redirect('/campgrounds');
	})
);

app.post(
	'/campgrounds/:id/reviews',
	validateReview,
	catchAsync(async (req, res) => {
		let { id } = req.params;
		let campground = await Campground.findById(id);
		const review = new Review(req.body.review);
		campground.reviews.push(review);
		await review.save();
		await campground.save();
		res.redirect(`/campgrounds/${campground._id}`);
	})
);

app.delete(
	'/campgrounds/:id/reviews/:reviewId',
	catchAsync(async (req, res) => {
		const { id, reviewId } = req.params;
		await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
		await Review.findByIdAndDelete(reviewId);
		res.redirect(`/campgrounds/${id}`);
	})
);

app.all('*', (req, res, next) => {
	next(new ExpressError('Page not found', 404));
});

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if (!err.message) err.message = 'Something went wrong';
	res.status(statusCode).render('error', { err });
});

app.listen(port, () => {
	console.log(`Server listening on port: ${port}`);
});
