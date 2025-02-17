import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import DataBaseConnection from '../lib/sequelize';

export class Precio extends Model<
  InferAttributes<Precio>,
  InferCreationAttributes<Precio>
> {
  declare id: CreationOptional<number>;
  declare esp: string;
  declare ma: number;
  declare mapk: number;
  declare env: string;
  declare kg: number;
  declare cal: string;
  declare tam: string;
  declare proc: string;
  declare var: string;
  declare archivo: string;
  declare fecha: string;
}

export const initPrecio = async () => {
  const sequelize = await DataBaseConnection.getSequelizeInstance();

  Precio.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      esp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ma: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      mapk: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      env: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      kg: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      cal: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tam: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      proc: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      var: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      archivo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'precio',
      timestamps: false,
    }
  );
};
