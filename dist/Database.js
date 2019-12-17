"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = __importStar(require("mysql2/promise"));
const MySQLBuilder_1 = require("./MySQL/MySQLBuilder");
class Database {
    constructor(config, builder) {
        if (!config.get('db')) {
            throw new Error("The database configuration has not been loaded, please use the tag 'db'.");
        }
        this.config = config;
        this.builder = builder || MySQLBuilder_1.MySQLBuilder;
    }
    table(table) {
        return new this.builder(this).table(table);
    }
    async query(query, bindings) {
        const { results } = await this.internalQuery(query, bindings || []);
        return results;
    }
    async internalQuery(query, bindings) {
        const connection = await mysql.createConnection({
            host: this.config.get('db.host'),
            user: this.config.get('db.user'),
            password: this.config.get('db.password'),
            database: this.config.get('db.database'),
            port: this.config.get('db.port', 3306),
        });
        try {
            const [results, fields] = await connection.query(query, bindings);
            connection.end();
            return { results, fields };
        }
        catch (e) {
            connection.end();
            throw e;
        }
    }
}
exports.Database = Database;
