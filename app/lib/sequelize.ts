import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';

export default class DataBaseConnection {
  static sequelize: Sequelize

  static getSequelizeInstance = async (): Promise<Sequelize> => {
    if (!DataBaseConnection.sequelize) {
      const { NEXT_PUBLIC_BD_HOST, NEXT_PUBLIC_BD_PUERTO, NEXT_PUBLIC_BD_USUARIO, NEXT_PUBLIC_BD_PASSWORD, NEXT_PUBLIC_BD_BASE } = process.env
      if (!NEXT_PUBLIC_BD_USUARIO || !NEXT_PUBLIC_BD_PASSWORD || !NEXT_PUBLIC_BD_BASE) {
        console.error('error: some env vars is/are missing (BD_USUARIO, BD_PASSWORD, BD_BASE)')
        throw Error('error: some env vars is/are missing (BD_USUARIO, BD_PASSWORD, BD_BASE)')
      }

      DataBaseConnection.sequelize = new Sequelize(NEXT_PUBLIC_BD_BASE, NEXT_PUBLIC_BD_USUARIO, NEXT_PUBLIC_BD_PASSWORD, {
        host: NEXT_PUBLIC_BD_HOST || `localhost`,
        port: NEXT_PUBLIC_BD_PUERTO ? parseInt(NEXT_PUBLIC_BD_PUERTO) : 3306,
        dialect: 'mysql',
        dialectModule: mysql2,
        pool: {
          max: 10,
          min: 0,
          idle: 10000
        },
      })
    }

    try {
      await DataBaseConnection.sequelize.authenticate();
      console.log('DB connection has been established successfully.')
    } catch (error) {
      console.error('Unable to connect to the database:', error)
      throw Error(`Unable to connect to the database: ${error}`)
    }

    return DataBaseConnection.sequelize
  }
}