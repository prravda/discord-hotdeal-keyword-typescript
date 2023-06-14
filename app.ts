import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from './infra/database/app-datasource';
import { KeywordRepository } from './src/keywords/repository';
import { KeywordService } from './src/keywords/service';
import { USER_CAME_FROM } from './src/users/etc/USER_CAME_FROM';

const bootstrap = async () => {
    try {
        // init database instance
        await AppDataSource.getDataSource().initialize();

        // TODO: make this job into e2e testing
        // const service = new KeywordService(new KeywordRepository());
        // const firstInsertResult = await service.insertKeywordsWithUserId(
        //     'abc-def-123124-!@#!@',
        //     ['문상', '컬쳐랜드', '보먹돼'],
        //     USER_CAME_FROM.DISCORD
        // );
        // const secondInsertResult = await service.insertKeywordsWithUserId(
        //     'hij-klm-123124-!@#!@',
        //     ['컬쳐랜드', '보먹돼', '캣츠랑'],
        //     USER_CAME_FROM.DISCORD
        // );
        //
        // const keywordsInDatabase = await service.getAllKeywords();
        // keywordsInDatabase.forEach((k) => console.log(k));
        //
        // const keywordsAndItsUsersInDatabase =
        //     await service.getAllKeywordsAndUsers();
        // keywordsAndItsUsersInDatabase.forEach((k) => console.log(k));
    } catch (e) {
        console.error(e);
        throw e;
    }
};

bootstrap();
