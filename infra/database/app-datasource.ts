import { DataSource } from 'typeorm';
import { User } from '../../src/users/entity';
import { Keyword } from '../../src/keywords/entity';
import { ENV_LIST } from '../env-config';

export class AppDataSource {
    private static appDataSource: DataSource;

    public static getDataSource(): DataSource {
        try {
            if (!this.appDataSource) {
                this.appDataSource = new DataSource({
                    type: 'postgres',
                    host: 'database-postgres',
                    port: 5432,
                    username: ENV_LIST.DATABASE_USER,
                    password: ENV_LIST.DATABASE_PASSWORD,
                    database: ENV_LIST.DATABASE_NAME,
                    synchronize: true,
                    logging: true,
                    entities: [User, Keyword],
                    poolSize: 10,
                    connectTimeoutMS: 250,
                });
            }
            return this.appDataSource;
        } catch (e) {
            throw e;
        }
    }
}
