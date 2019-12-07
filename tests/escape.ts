import { expect } from 'chai';

import { escapeColumn, escapeTable, escapeValue, escapeValues } from '../src/escape';

describe('escape', () => {
  describe('escapeTable', () => {
    it('can escape a table with nothing fancy', () => {
      expect(escapeTable('users')).to.equal('`users`');
    });

    it('can escape a table which has been aliased with an uppercase AS', () => {
      expect(escapeTable('users AS u')).to.equal('`users` AS `u`');
    });

    it('can escape a table which has been aliased with a lowercase as', () => {
      expect(escapeTable('users as u')).to.equal('`users` AS `u`');
    });

    it('should allow spaces in the alias', () => {
      expect(escapeTable('users AS u table'))
        .to.equal('`users` AS `u table`');
    });
  });

  describe('escapeColumn', () => {
    it('can escape a simple column', () => {
      expect(escapeColumn('id')).to.equal('`id`');
    });

    it('can escape a column with a table prefix', () => {
      expect(escapeColumn('users.id')).to.equal('`users`.`id`');
    });

    it('can escape a column which is using an alias', () => {
      expect(escapeColumn('id AS user_id')).to.equal('`id` AS `user_id`');
    });

    it('can escape a column with has an alias with a lowercase as', () => {
      expect(escapeColumn('id as user_id')).to.equal('`id` AS `user_id`');
    });

    it('can escape a column which has already been escaped', () => {
      expect(escapeColumn('`id`')).to.equal('`id`');
    });

    it('can escape a column which has a table prefix and alias', () => {
      expect(escapeColumn('users.id AS user_id'))
        .to.equal('`users`.`id` AS `user_id`');
    });

    it('can escape escape a full escaped aliased and prefixed column', () => {
      const escaped = '`users`.`id` AS `user_id`';
      expect(escapeColumn(escaped)).to.equal(escaped);
    });
  });

  describe('escapeValue(s)', () => {
    it('can escape an integer', () => {
      expect(escapeValue(5)).to.equal('5');
    });

    it('can escape a string', () => {
      expect(escapeValue('SELECT * FROM users;'))
        .to.equal('\'SELECT * FROM users;\'');
    });

    it('can escape multiple values at the same time', () => {
      const escaped = escapeValues([2, 'Foo']);

      expect(escaped[0]).to.equal('2');
      expect(escaped[1]).to.equal('\'Foo\'');
    });
  });
});
