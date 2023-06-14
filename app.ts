import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from './infra/database/app-datasource';

const bootstrap = async () => {
    try {
        // init database instance
        await AppDataSource.getDataSource().initialize();
    } catch (e) {
        console.error(e);
        throw e;
    }
};

bootstrap();
