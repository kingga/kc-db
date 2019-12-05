import { createDb } from './connection';

async function dropTables(tables: string[]): Promise<void> {
  const db = await createDb();

  return new Promise((resolve, reject) => {
    const table = tables.shift();

    db.query('SET FOREIGN_KEY_CHECKS = 0;', [], (err) => {
      if (err) {
        db.end();

        return reject(err);
      }

      db.query(`DROP TABLE IF EXISTS ${table};`, [], (err) => {
        if (err) {
          return reject(err);
        }

        if (tables.length) {
          dropTables(tables).then(resolve).catch(reject);
        } else {
          resolve();
        }

        db.end();
      });
    });
  });
}

async function cleanDb(): Promise<void> {
  const db = await createDb();

  return new Promise((resolve, reject) => {
    db.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'kc_db\';', [], (err, results: { TABLE_NAME: string }[]) => {
      if (err) {
        return reject(err);
      }

      dropTables(results.map((t) => t.TABLE_NAME)).then(resolve).catch(reject);
    });

    db.end();
  });
}

async function createTables(): Promise<void> {
  const db = await createDb();

  return new Promise((resolve, reject) => {
    db.query(`
    CREATE TABLE user_roles (
      id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL
    );
    `, [], (err) => {
      if (err) {
        return reject(err);
      }

      db.query(`
      CREATE TABLE users (
        id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role_id BIGINT UNSIGNED NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES user_roles (id) ON DELETE CASCADE ON UPDATE CASCADE
      );
      `, [], (err) => {
        if (err) {
          return reject(err);
        }

        db.query(`
        CREATE TABLE donations (
          id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          amount FLOAT UNSIGNED NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL,
          CONSTRAINT fk_donations_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
        );
        `, [], (err) => {
          if (err) {
            return reject(err);
          }

          db.end();
        });

        resolve();
      });
    });
  });
}

interface UserDetails {
  name: string;
  email: string;
  role_id: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface User extends UserDetails {
  id: number;
}

async function createUser(details: UserDetails): Promise<void> {
  const db = await createDb();
  const columns: string[] = [];
  const values: string[] = [];

  for (const [k, v] of Object.entries(details)) {
    columns.push(`\`${k}\``);
    values.push(`'${v.toString()}'`);
  }

  return new Promise((resolve, reject) => {
    db.query(`INSERT INTO users (${columns.join(', ')}) VALUES (${values.join(', ')})`, [], (err) => {
      if (err) {
        return reject(err);
      }

      resolve();
    });

    db.end();
  });
}

async function createDonation(userId: number, amount: number): Promise<void> {
  const db = await createDb();

  return new Promise((resolve, reject) => {
    db.query('INSERT INTO donations (user_id, amount) VALUES (?, ?);', [userId, amount], (err) => {
      if (err) {
        return reject(err);
      }

      resolve();
    });

    db.end();
  });
}

async function createRole(name: string): Promise<void> {
  const db = await createDb();

  return new Promise((resolve, reject) => {
    db.query('INSERT INTO user_roles (name) VALUES (?);', [name], (err) => {
      if (err) {
        return reject(err);
      }

      resolve();
    });

    db.end();
  });
}

export async function seed(): Promise<null> {
  await cleanDb();
  await createTables();
  await createRole('Admin');
  await createRole('Moderator');
  await createRole('Reviewer');
  await createRole('Subscriber');
  await createRole('Guest');

  await createUser({ name: 'Isaac Skelton', email: 'contact@isaacskelton.com', role_id: 1 });
  await createUser({ name: 'Jane Doe', email: 'jane.d@example.com', role_id: 2 });
  await createUser({ name: 'Joe Bloggs', email: 'joe.b@example.com', role_id: 2 });
  await createUser({ name: 'John Doe', email: 'john.d@example.com', role_id: 3 });
  await createUser({ name: 'Joe King', email: 'joe.k@example.com', role_id: 4 });

  await createDonation(2, 4000);
  await createDonation(2, 1000);
  await createDonation(1, 2.5);
  await createDonation(1, 7.5);

  return new Promise((resolve) => resolve());
}
