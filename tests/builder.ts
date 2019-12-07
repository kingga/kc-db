import { expect } from 'chai';

import { MySQLBuilder } from '../src/MySQL/MySQLBuilder';
import { BuilderConstructor } from '../src/types';
import { makeDB } from './helpers/functions';
import { seed, User } from './helpers/seed';

interface UserRole {
  id: number;
  name: string;
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

const tableNotSetError = 'The table is not set.';

function run(cls: BuilderConstructor) {
  describe(cls.name, () => {
    it('should be able to run a simple select using the builder', async () => {
      await seed();
      const db = makeDB(cls);
      const users = await db.table('users').where('id', '=', 1).get<User>(['id', 'name']);

      expect(users[0].id).equals(1);
      expect(users[0].name).equals('Isaac Skelton');
    });

    it('should be able to run a simple select query and only return one result', async () => {
      await seed();
      const db = makeDB(cls);
      const user = await db.table('users').where('id', '=', 1).first<User>(['id', 'name']);

      expect((user || { id: 0 }).id).to.equal(1);
      expect((user || { name: '' }).name).to.equal('Isaac Skelton');
    });

    it('should be able to build a complex query with select, where, order, having and limit', async () => {
      await seed();
      const db = makeDB(cls);
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
      const db = makeDB(cls);
      const count = await db.table('users AS u')
        .join('user_roles AS r', 'u.role_id', '=', 'r.id')
        .groupBy('r.id')
        .where('r.id', '=', 2)
        .count();

      expect(count).to.equal(2);
    });

    it('can get the lowest amount spent by a user for donations', async () => {
      await seed();
      const db = makeDB(cls);
      const amount = await db.table('donations as d')
        .leftJoin('users AS u', 'u.id', '=', 'd.user_id')
        .min('d.amount');

      expect(amount).to.equal(2.5);
    });

    it('can get the highest amount spent by a user for donations', async () => {
      await seed();
      const db = makeDB(cls);
      const amount = await db.table('donations as d')
        .leftJoin('users AS u', 'u.id', '=', 'd.user_id')
        .max('d.amount');

      expect(amount).to.equal(4000);
    });

    it('can get the average number of users per role', async () => {
      await seed();
      const p1 = makeDB(cls).table('user_roles').count();
      const p2 = makeDB(cls).table('users').count();
      const p3 = makeDB(cls).table('user_roles AS r')
        .join('users AS u', 'u.role_id', '=', 'r.id')
        .groupBy('r.id')
        .avg('r.id');

      const [roleCount, userCount, avg] = await Promise.all([p1, p2, p3]);

      expect(avg).to.closeTo(roleCount / userCount, 0.0);
    });

    it('can get the sum of donations', async () => {
      await seed();
      const sum = await makeDB(cls).table('donations').sum('amount');

      expect(sum).to.equal(5010);
    });

    it('can get all uses in a group of IDs', async () => {
      await seed();
      const users = await makeDB(cls).table('users')
        .whereIn('id', [1, 2])
        .get<{ id: number }>(['id']);

      expect(users[0].id).to.equal(1);
      expect(users[1].id).to.equal(2);
    });

    it('should throw an error if the column doesn\'t exist', (done) => {
      seed().then(() => {
        makeDB(cls).table('users').sum('amount')
          .then(() => done(new Error('It did not throw an exception.')))
          .catch(() => done());
      });
    });

    it('can get everything from the users table', async () => {
      await seed();
      const user = await makeDB(cls).table('users').where('id', '=', 1).first();

      expect(user).to.contain({
        id: 1,
        name: 'Isaac Skelton',
        email: 'contact@isaacskelton.com',
        role_id: 1,
      });
    });

    it('can get the first role which has more than one user assigned to it', async () => {
      await seed();
      const role = await makeDB(cls).table('users AS u')
        .join('user_roles AS r', 'r.id', '=', 'u.role_id')
        .groupBy('r.id')
        .havingRaw('COUNT(r.id) > 1')
        .first<{ id: number }>(['r.id']);

      expect((role || { id: 0 }).id).to.equal(2);
    });

    it('can get all possible combinations of the first user with all of the roles', async () => {
      await seed();
      const p1 = makeDB(cls).table('users').first<{ name: string }>(['name']);
      const p2 = makeDB(cls).table('users AS u')
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

    it('can do a join function with a where clause', async () => {
      await seed();
      const db = makeDB(cls);

      const count = await db.table('users AS u')
        .innerJoin('donations AS d', (join) => {
          join.on('u.id', '=', 'd.user_id')
            .where('d.user_id', '=', 1)
            .where('d.amount', '=', 4000);
        })
        .count();

      expect(count).to.equal(1);
    });

    it('can update a value in the database with no conditions', async () => {
      await seed();
      const db = makeDB(cls);

      await db.table('users').update({ role_id: 1 });
      const users = await db.table('users').get<{ role_id: number }>(['role_id']);

      for (const { role_id } of users) {
        expect(role_id).to.equal(1);
      }
    });

    it('can update a certain user in the database', async () => {
      await seed();
      const db = makeDB(cls);

      await db.table('users')
        .where('id', '=', 1)
        .update({ name: 'I M Skelton' });

      const user = await db.table('users').first<User>();

      expect(user).to.not.be.null;

      if (user) {
        expect(user.name).to.equal('I M Skelton');
      }
    });

    it('can delete a user in the database', async () => {
      await seed();
      const db = makeDB(cls);

      await db.table('users')
        .where('id', '=', 2)
        .delete();

      const user = await db.table('users').where('id', '=', 2).first<User>();

      expect(user).to.be.null;
    });

    it('can throw an error if the table isn\'t set when deleting', async () => {
      const db = makeDB(cls);

      try {
        await new MySQLBuilder(db).delete();
        expect(false).to.be.true('An error wasn\'t thrown when deleting without a table.');
      } catch (e) {
        expect(e).to.equal(tableNotSetError);
      }
    });

    it('can throw an error if the table isn\'t set when inserting', async () => {
      const db = makeDB(cls);

      try {
        await new MySQLBuilder(db).insertGetId({});
        expect(false).to.be.true('An error wasn\'t thrown when inserting without a table.');
      } catch (e) {
        expect(e).to.equal(tableNotSetError);
      }
    });

    it('can throw an error if the table isn\'t set when updating a row', async () => {
      const db = makeDB(cls);

      try {
        await new MySQLBuilder(db).update({});
        expect(false).to.be.true('An error wasn\'t thrown when updating without a table.');
      } catch (e) {
        expect(e).to.equal(tableNotSetError);
      }
    });

    it('can insert multiple rows at the same time', async () => {
      await seed();
      const db = makeDB(cls);
      await db.table('users')
        .insert<{ name: string; email: string; role_id: number }>([
          { name: 'Gordon Freeman', email: 'gordon.f@example.com', role_id: 1 },
          { name: 'Bruce Wayne', email: 'batman@example.com', role_id: 4 },
        ]);

      const users = await db.table('users')
        .whereLike('name', 'G% Freeman')
        .orWhereLike('name', 'B% Wayne')
        .get<{ name: string }>(['name']);

      expect(users).to.lengthOf(2);
      expect(users[0].name).to.equal('Gordon Freeman');
      expect(users[1].name).to.equal('Bruce Wayne');
    });

    it('can perform a right join', async () => {
      await seed();
      const db = makeDB(cls);
      const user = await db.table('users AS u')
        .rightJoin('user_roles AS r', 'r.id', '=', 'u.role_id')
        .where('r.id', '=', 5)
        .first<{ name: string | null }>(['u.name']);

      expect(user).to.not.be.null;

      if (user !== null) {
        expect(user.name).to.be.null;
      }
    });

    it('can get a distinct result set', async () => {
      await seed();
      const db = makeDB(cls);
      const count = await db.table('users AS u')
        .crossJoin('user_roles AS r')
        .groupBy('r.id')
        .distinct()
        .count('r.id');

      expect(count).to.equal(getAllRoles().length);
    });
  });

  it('can select single columns at a time and build it up', async () => {
    await seed();
    const db = makeDB(cls);
    const user = await db.table('users')
      .where('id', '=', 1)
      .select('id')
      .select('name')
      .first<{ id: number, name: string }>();

    expect(user).to.not.be.null;

    if (user !== null) {
      expect(user.id).to.equal(1);
      expect(user.name).to.equal('Isaac Skelton');
    }
  });

  it('can update with multiple conditions', async () => {
    await seed();
    const db = makeDB(cls);
    await db.table('users')
      .whereIn('id', [1, 2, 4])
      .whereNotLike('name', 'J% Doe')
      .update({ name: 'I M Skelton' });

    const users = await db.table('users')
      .whereIn('id', [1, 2, 4])
      .get<{ id: number, name: string }>(['id', 'name']);

    expect(users).to.have.lengthOf(3);

    for (const { id, name } of users) {
      if (id === 1) {
        expect(name).to.equal('I M Skelton');
      } else {
        expect(name).to.not.equal('I M Skelton');
      }
    }
  });

  it('can check if a column is null or not null', async () => {
    await seed();
    const db = makeDB();
    const originalCount = await db.table('users').count();
    await db.table('users')
      .where('id', '=', 2)
      .update({ deleted_at: '2019-12-07 17:45:40' });

    const nn = db.table('users').whereNotNull('deleted_at').count();
    const n = db.table('users').whereNull('deleted_at').count();
    const onn = db.table('users').where('id', '=', 2).orWhereNotNull('deleted_at').count();
    const on = db.table('users').where('id', '=', 2).orWhereNull('deleted_at').count();
    const [nnCount, nCount, onnCount, onCount] = await Promise.all([nn, n, onn, on]);

    expect(nnCount).to.equal(1);
    expect(nCount).to.equal(originalCount - 1);
    expect(onnCount).to.equal(1);
    expect(onCount).to.equal(originalCount);
  });

  it('can run raw where queries', async () => {
    await seed();
    const db = makeDB(cls);

    const count = await db.table('users')
      .whereRaw('FIND_IN_SET(id, "1,3")')
      .orWhereRaw('FIND_IN_SET(id, "4,5")')
      .count();

    expect(count).to.equal(4);
  });

  it('can run a where not like query', async () => {
    await seed();
    const db = makeDB(cls);

    const count = await db.table('users')
      .whereNotLike('name', 'J% Doe')
      .whereNotLike('name', 'Joe %')
      .count();

    const count2 = await db.table('users')
      .where('id', '!=', 2)
      .orWhereNotLike('name', 'I% Skelton')
      .count();

    expect(count).to.equal(1);
    expect(count2).to.equal(5);
  });

  it('can run a simple query with no conditions attached', async () => {
    await seed();
    const db = makeDB(cls);

    const count = await db.table('users').count();

    expect(count).to.equal(5);
  });

  it('can get values between or not between two values', async () => {
    await seed();
    const db = makeDB(cls);

    const notBetween = db.table('users').whereNotBetween('id', 2, 5).count();
    const between = db.table('users').whereBetween('id', 2, 5).count();

    const orNotBetween = db.table('users')
      .whereNotBetween('id', 1, 2)
      .orWhereNotBetween('id', 2, 4)
      .count();

    const orBetween = db.table('users')
      .whereBetween('id', 1, 2)
      .orWhereBetween('id', 4, 5)
      .count();

    const [notBetweenCount, betweenCount, orNotBetweenCount, orBetweenCount] = await Promise.all([
      notBetween,
      between,
      orNotBetween,
      orBetween,
    ]);

    expect(notBetweenCount).to.equal(1);
    expect(betweenCount).to.equal(4);
    expect(orNotBetweenCount).to.equal(4);
    expect(orBetweenCount).to.equal(4);
  });

  it('can run a where not in query', async () => {
    await seed();
    const db = makeDB(cls);

    const notIn = db.table('users').whereNotIn('id', [2, 3, 4, 5]).count();
    const orNotIn = db.table('users').whereNotIn('id', [2, 3]).orWhereNotIn('id', [3, 4]).count();
    const [notInCount, orNotInCount] = await Promise.all([notIn, orNotIn]);

    expect(notInCount).to.equal(1);
    expect(orNotInCount).to.equal(4);
  });

  it('can convert NULL value into whereNull if passed into or where', async () => {
    await seed();
    const db = makeDB(cls);

    const count = await db.table('users')
      .where('id', '=', 1)
      .orWhere('deleted_at', '=', null)
      .count();

    expect(count).to.equal(5);
  });

  it('can run a or where query', async () => {
    await seed();
    const db = makeDB(cls);

    const count = await db.table('users')
      .where('id', '=', 1)
      .orWhere('id', '=', 2)
      .count();

    expect(count).to.equal(2);
  });

  it('can run a or where in query', async () => {
    await seed();
    const db = makeDB(cls);

    const count = await db.table('users')
      .where('id', '=', 1)
      .orWhereIn('id', [3, 4])
      .count();

    expect(count).to.equal(3);
  });
}

run(MySQLBuilder);
