module.exports = {
  development: {
    username: process.env.DB_USER || "epicbook_user",
    password: process.env.DB_PASSWORD || "your_secure_db_password",
    database: process.env.DB_NAME || "bookstore",
    host: process.env.DB_HOST || "db",
    dialect: "mysql",
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "db",
    dialect: "mysql",
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    logging: false
  }
};
