import { NonPersistentConfig } from '@kingga/kc-config';
import Container from '@kingga/kc-container';
import { expect } from 'chai';

import { Database } from '../src/Database';
import { makeDB } from './helpers/functions';
import { seed, User } from './helpers/seed';

describe('Database', () => {
  it('shoud be able to run a raw query.', async () => {
    await seed();
    const db = makeDB();
    const users = await db.query<User>('SELECT `id`, `name` FROM `users` WHERE `id` = 1 LIMIT 1;');

    expect(users[0].id).equals(1);
    expect(users[0].name).equals('Isaac Skelton');
  });

  it('should be able to run a binded query.', async () => {
    await seed();
    const db = makeDB();
    const users = await db.query<User>('SELECT `id`, `name` FROM `users` WHERE `id` = ? LIMIT ?;', [1, 1]);

    expect(users).to.have.lengthOf(1);
    expect(users[0].id).equals(1);
    expect(users[0].name).equals('Isaac Skelton');
  });

  it('should throw an error if no database config was defined.', () => {
    try {
      new Database(new NonPersistentConfig({}, new Container()));
      expect(true).to.be.false('An error wasn\'t thrown when no db config was supplied.');
    } catch (e) {
      expect(true).to.be.true;
    }
  });
});
