import { connectDB, disconnectDB } from '../src/config/database.js';
import { User } from '../src/models/User.js';

const SEED_USER = {
  username: 'nyamka1231',
  password: 'Pass@1234',
};

async function seedDatabase(): Promise<void> {
  try {
    await connectDB();

    const existingUser = await User.findOne({
      username: SEED_USER.username,
    });

    if (existingUser) {
      console.log(`✓ User "${SEED_USER.username}" already exists`);
      console.log('  Skipping seed...');
      return;
    }

    const user = new User({
      username: SEED_USER.username,
      password: SEED_USER.password,
    });

    await user.save();
    console.log(`✓ User "${SEED_USER.username}" created successfully`);
    console.log(`  Created at: ${user.createdAt}`);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

seedDatabase();
