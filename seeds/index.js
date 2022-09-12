const mongoose = require('mongoose');
const campground = require('../models/campground');
const Campground = require('../models/campground');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error'));
db.once('open', () => console.log('database open'));

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
	await Campground.deleteMany({});
	for (let i = 0; i < 15; i++) {
		const random = Math.floor(Math.random() * 1000);
		const price = Math.floor(Math.random() * 30);
		const camp = new Campground({
			location: `${cities[random].city}, ${cities[random].state}`,
			title: `${sample(descriptors)} ${sample(places)}`,
			image: 'https://source.unsplash.com/collection/483251',
			description:
				'Lorem ipsum dolor sit amet consectetur adipisicing elit. Illo maxime accusantium, illum non officia provident reprehenderit dicta? Itaque dolor dignissimos nemo! Iusto vel libero aut repellat aspernatur officiis, esse totam',
			price,
		});
		await camp.save();
	}
};
seedDB().then(() => {
	mongoose.connection.close();
	console.log('done');
});
