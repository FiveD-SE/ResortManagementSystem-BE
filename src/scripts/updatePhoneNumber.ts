import { MongoClient } from 'mongodb';

async function updateUserPhones() {
	const uri =
		'mongodb+srv://slowey:g8CuparZe67ykvCt@resort-2.zgb0h.mongodb.net/';
	const client = new MongoClient(uri);

	try {
		await client.connect();
		console.log('Connected to MongoDB');

		const database = client.db('resort-management-system');
		const usersCollection = database.collection('users');

		// Find all users without a phone number or with null/empty phone
		const result = await usersCollection.updateMany(
			{
				$or: [
					{ phoneNumber: { $exists: false } },
					{ phoneNumber: null },
					{ phoneNumber: '' },
				],
			},
			{
				$set: { phoneNumber: '+84 113' },
			},
		);

		console.log(`Updated ${result.modifiedCount} users`);
		console.log(`Matched ${result.matchedCount} documents`);
	} catch (error) {
		console.error('Error updating users:', error);
	} finally {
		await client.close();
		console.log('Disconnected from MongoDB');
	}
}

// Execute the update
updateUserPhones().catch(console.error);
