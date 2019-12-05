import { MySQLBuilder } from '../src/MySQL/MySQLBuilder';
import { IBuilder } from '../src/contracts/IBuilder';
import { expect } from 'chai';
import { IConfig } from '@kingga/kc-config';
import { User, seed } from './helpers/seed';
import { getConfig } from './helpers/connection';

type BuilderConstructor<T> = new (config: IConfig) => T;

interface UserRole {
  id: number;
  name: string;
}

function makeDB<T>(cls: BuilderConstructor<T>) {
  return new cls(getConfig());
}

function getAllRoles(): UserRole[] {
  return [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Moderator' },
    { id: 3, name: 'Reviewer' },
    { id: 4, name: 'Subscriber' },
    { id: 5, name: 'Guest' },
  ];
}

function run<T extends IBuilder>(cls: BuilderConstructor<T>) {
  describe(cls.name, () => {
    it('shoud be able to run a raw query.', async () => {
      await seed();
      const db = makeDB<T>(cls);
      const users = await db.query<User>('SELECT `id`, `name` FROM `users` WHERE `id` = 1 LIMIT 1;');

      expect(users[0].id).equals(1);
      expect(users[0].name).equals('Isaac Skelton');
    });

    it('should be able to run a simple select using the builder', async () => {
      await seed();
      const db = makeDB<T>(cls);
      const users = await db.table('users').where('id', '=', 1).get<User>(['id', 'name']);

      expect(users[0].id).equals(1);
      expect(users[0].name).equals('Isaac Skelton');
    });

    it('should be able to run a simple select query and only return one result', async () => {
      await seed();
      const db = makeDB<T>(cls);
      const user = await db.table('users').where('id', '=', 1).first<User>(['id', 'name']);

      expect((user || { id: 0 }).id).to.equal(1);
      expect((user || { name: '' }).name).to.equal('Isaac Skelton');
    });

    it('should be able to build a complex query with select, where, order, having and limit', async () => {
      await seed();
      const db = makeDB<T>(cls);
      const expected = [
        { id: 3, name: 'Joe Bloggs' },
        { id: 5, name: 'Joe King' },
      ];

      const users = await db.table('users')
        .where('name', 'LIKE', 'Joe %')
        .where('deleted_at', '=', null)
        .orderBy('id', 'DESC')
        .having('id', '>', 2)
        .limit(2)
        .get<User>(['id', 'name']);

      expect(users).length(2);
      users.reverse().forEach((user, index) => {
        expect(user.id).to.equal(expected[index].id);
        expect(user.name).to.equal(expected[index].name);
      });
    });

    it('can get the count of roles using a group and count', async () => {
      await seed();
      const db = makeDB<T>(cls);
      const count = await db.table('users AS u')
        .join('user_roles AS r', 'u.role_id', '=', 'r.id')
        .groupBy('r.id')
        .where('r.id', '=', 2)
        .count();

      expect(count).to.equal(2);
    });

    it('can get the lowest amount spent by a user for donations', async () => {
      await seed();
      const db = makeDB<T>(cls);
      const amount = await db.table('donations as d')
        .leftJoin('users AS u', 'u.id', '=', 'd.user_id')
        .min('d.amount');

      expect(amount).to.equal(2.5);
    });

    it('can get the highest amount spent by a user for donations', async () => {
      await seed();
      const db = makeDB<T>(cls);
      const amount = await db.table('donations as d')
        .leftJoin('users AS u', 'u.id', '=', 'd.user_id')
        .max('d.amount');

      expect(amount).to.equal(4000);
    });

    it('can get the average number of users per role', async () => {
      await seed();
      const p1 = makeDB<T>(cls).table('user_roles').count();
      const p2 = makeDB<T>(cls).table('users').count();
      const p3 = makeDB<T>(cls).table('user_roles AS r')
        .join('users AS u', 'u.role_id', '=', 'r.id')
        .groupBy('r.id')
        .avg('r.id');

      const [roleCount, userCount, avg] = await Promise.all([p1, p2, p3]);

      expect(avg).to.equal(roleCount / userCount);
    });

    it('can get the sum of donations', async () => {
      await seed();
      const sum = await makeDB<T>(cls).table('donations').sum('amount');

      expect(sum).to.equal(5010);
    });

    it('can get all uses in a group of IDs', async () => {
      await seed();
      const users = await makeDB<T>(cls).table('users')
        .whereIn('id', [1, 2])
        .get<{ id: number }>(['id']);

      expect(users[0].id).to.equal(1);
      expect(users[1].id).to.equal(2);
    });

    it('should throw an error if the column doesn\'t exist', (done) => {
      seed().then(() => {
        makeDB<T>(cls).table('users').sum('amount')
          .then(() => done(new Error('It did not throw an exception.')))
          .catch(() => done());
      });
    });

    it('can get everything from the users table', async () => {
      await seed();
      const user = await makeDB<T>(cls).table('users').where('id', '=', 1).first();

      expect(user).to.contain({
        id: 1,
        name: 'Isaac Skelton',
        email: 'contact@isaacskelton.com',
        role_id: 1,
      });
    });

    it('can get the first role which has more than one user assigned to it', async () => {
      await seed();
      const role = await makeDB<T>(cls).table('users AS u')
        .join('user_roles AS r', 'r.id', '=', 'u.role_id')
        .groupBy('r.id')
        .havingRaw('COUNT(r.id) > 1')
        .first<{ id: number }>(['r.id']);

      expect((role || { id: 0 }).id).to.equal(2);
    });

    it('can get all possible combinations of the first user with all of the roles', async () => {
      await seed();
      const p1 = makeDB<T>(cls).table('users').first<{ name: string }>(['name']);
      const p2 = makeDB<T>(cls).table('users AS u')
        .crossJoin('user_roles AS r')
        .where('u.id', '=', 1)
        .get<{ userName: string, roleName: string }>(['u.name AS userName', 'r.name AS roleName']);

      const [user, roles] = await Promise.all([p1, p2]);
      const allRoles = getAllRoles();

      for (const i in allRoles) {
        expect(user).not.to.be.null;
        expect(roles).not.to.be.null;

        if (user !== null && roles !== null) {
          expect(roles[i].userName).to.equal(user.name);
          expect(roles[i] || null).not.to.be.null;

          if (typeof roles[i] !== 'undefined') {
            expect(roles[i].roleName).to.equal(allRoles[i].name);
          }
        }
      }
    });
  });
}

run(MySQLBuilder);
