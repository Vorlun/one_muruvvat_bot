import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface IBotCreationAttr {
  user_id: number;
  first_name?: string;
  last_name?: string;
  lang?: string;
  real_name?: string;
  role?: 'generous' | 'patient';
  username?: string;
  phone_number?: string;
  region?: string;
  district?: string;
  last_state?: string;
  status?: boolean;
  location?: string;
}

@Table({ tableName: 'bot' })
export class Bot extends Model<Bot, IBotCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    allowNull: false,
  })
  declare user_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare first_name?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare last_name?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare lang?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare real_name?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare username?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare phone_number?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare region?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare district?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare last_state?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare status?: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare location?: string; 

  @Column({
    type: DataType.ENUM('generous', 'patient'),
    allowNull: true,
  })
  declare role?: 'generous' | 'patient';
}
