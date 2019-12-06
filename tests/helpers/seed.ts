import { createDb } from './connection';

async function cleanDb(): Promise<void> {
  const db = await createDb();
  const [tables]: any = await db.query('SELECT table_name FROM information_schema.tables WHERE table_schema = ?;', ['kc_db']);

  await db.query('SET FOREIGN_KEY_CHECKS = 0;')

  for (const table of tables) {
    await db.query(`DROP TABLE IF EXISTS ${table.TABLE_NAME};`)
  }

  await db.query('SET FOREIGN_KEY_CHECKS = 1;')

  await db.end();
}

async function createTables(): Promise<void> {
  const db = await createDb();

  await db.query(`
  CREATE TABLE user_roles (
    id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL
  );
  `);

  await db.query(`
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
  `);

  await db.query(`
  CREATE TABLE donations (
    id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    amount FLOAT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT fk_donations_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
  );
  `);

  await db.end();
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

  await db.query(`INSERT INTO users (${columns.join(', ')}) VALUES (${values.join(', ')})`);
  await db.end();
}

async function createDonation(userId: number, amount: number): Promise<void> {
  const db = await createDb();
  await db.query('INSERT INTO donations (user_id, amount) VALUES (?, ?);', [userId, amount]);
  await db.end();
}

async function createRole(name: string): Promise<void> {
  const db = await createDb();
  await db.query('INSERT INTO user_roles (name) VALUES (?);', [name]);
  await db.end();
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
