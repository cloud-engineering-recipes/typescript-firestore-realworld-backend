import {Firestore} from '@google-cloud/firestore';
import * as bcrypt from 'bcryptjs';
import {AlreadyExistsError} from '../errors';
import {User} from './user';

class UsersService {
  private usersCollection = 'users';

  constructor(private firestore: Firestore) {}

  async registerUser(
    email: string,
    username: string,
    password: string
  ): Promise<User> {
    this.validatePasswordOrThrow(password);

    if (await this.getUserByEmail(email)) {
      throw new AlreadyExistsError('"email" is taken');
    }

    if (await this.getUserByUsername(username)) {
      throw new AlreadyExistsError('"username" is taken');
    }

    const passwordHash = await bcrypt.hash(password, 8);

    const document = await this.firestore.collection(this.usersCollection).add({
      email,
      username,
      passwordHash,
    });

    const user = new User(document.id, email, username, null, null);

    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snapshot = await this.firestore
      .collection(this.usersCollection)
      .where('email', '==', email)
      .get();

    if (snapshot.empty) {
      return undefined;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const user = new User(
      userDoc.id,
      userData.email,
      userData.username,
      userData.bio,
      userData.image
    );

    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await this.firestore
      .collection(this.usersCollection)
      .where('username', '==', username)
      .get();

    if (snapshot.empty) {
      return undefined;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const user = new User(
      userDoc.id,
      userData.email,
      userData.username,
      userData.bio,
      userData.image
    );

    return user;
  }

  private validatePasswordOrThrow(password: string): void {
    if (password.length < 8) {
      throw new RangeError('"password" must contain at least 8 characters');
    }
  }
}

export {UsersService};
