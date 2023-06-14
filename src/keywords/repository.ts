import { KeywordRepositoryInterface } from './interfaces/keyword-repository.interface';
import { KeywordDomain } from './domain/keyword';
import { AppDataSource } from '../../infra/database/app-datasource';
import { Keyword } from './entity';
import { Repository } from 'typeorm';
import { User } from '../users/entity';
import { USER_CAME_FROM } from '../users/etc/USER_CAME_FROM';

export class KeywordRepository implements KeywordRepositoryInterface {
    private keywordRepositoryTypeORM: Repository<Keyword>;
    private userRepositoryTypeORM: Repository<User>;
    constructor() {
        this.keywordRepositoryTypeORM =
            AppDataSource.getDataSource().getRepository<Keyword>(Keyword);
        this.userRepositoryTypeORM =
            AppDataSource.getDataSource().getRepository<User>(User);
    }

    public async getAllKeywords(): Promise<KeywordDomain[]> {
        try {
            const result = await this.keywordRepositoryTypeORM
                .createQueryBuilder('keywords')
                .getMany();

            return result.map<KeywordDomain>((keyword) =>
                KeywordDomain.fromTypeORMWithoutUser(keyword)
            );
        } catch (e) {
            throw e;
        }
    }

    public async getKeywordsByUserIdAndSource(
        userId: string,
        cameFrom: USER_CAME_FROM
    ): Promise<KeywordDomain[]> {
        try {
            const result = await this.keywordRepositoryTypeORM
                .createQueryBuilder('keywords')
                .leftJoinAndSelect('keywords.users', 'users')
                .where('users.userId = :userId', { userId })
                .andWhere('users.cameFrom = :cameFrom', { cameFrom })
                .getMany();

            return result.map<KeywordDomain>((res) =>
                KeywordDomain.fromTypeORM(res)
            );
        } catch (e) {
            throw e;
        }
    }

    public async insertKeywordsWithUserId(
        userId: string,
        keywords: string[],
        cameFrom: USER_CAME_FROM
    ): Promise<KeywordDomain[]> {
        let userInDatabase = await this.userRepositoryTypeORM
            .createQueryBuilder('users')
            .where('users.userId = :userId', { userId })
            .getOne();

        if (!userInDatabase) {
            const userTypeOrmEntity = new User();
            userTypeOrmEntity.userId = userId;
            userTypeOrmEntity.cameFrom = cameFrom;

            userInDatabase = await this.userRepositoryTypeORM.save<User>(
                userTypeOrmEntity
            );
        }

        const keywordEntities = await Promise.all(
            keywords.map<Promise<Keyword>>(async (keyword) => {
                const keywordInDatabase = await this.keywordRepositoryTypeORM
                    .createQueryBuilder('keywords')
                    .where('keywords.keywordHash = :keywordHash', {
                        keywordHash: keyword,
                    })
                    .leftJoinAndSelect('keywords.users', 'users')
                    .getOne();

                if (keywordInDatabase && userInDatabase) {
                    if (keywordInDatabase.users) {
                        keywordInDatabase.users.push(userInDatabase);
                    }
                    if (!keywordInDatabase.users) {
                        keywordInDatabase.users = [userInDatabase];
                    }
                    return keywordInDatabase;
                }

                const keywordTypeOrmEntity = new Keyword();
                keywordTypeOrmEntity.keyword = keyword;
                keywordTypeOrmEntity.keywordHash = keyword;
                if (userInDatabase) {
                    keywordTypeOrmEntity.users = [userInDatabase];
                }

                return keywordTypeOrmEntity;
            })
        );

        const result = await this.keywordRepositoryTypeORM.save<Keyword>(
            keywordEntities
        );

        return result.map<KeywordDomain>((res) =>
            KeywordDomain.fromTypeORM(res)
        );
    }

    public async getAllKeywordsAndUsers(): Promise<KeywordDomain[]> {
        try {
            const keywordEntities = await this.keywordRepositoryTypeORM
                .createQueryBuilder('keywords')
                .leftJoinAndSelect('keywords.users', 'users')
                .getMany();

            return keywordEntities.map<KeywordDomain>((entity) =>
                KeywordDomain.fromTypeORM(entity)
            );
        } catch (e) {
            throw e;
        }
    }

    public async getKeywordAndUsersByHash(
        keywordHash: string
    ): Promise<KeywordDomain> {
        try {
            const keywordEntity = await this.keywordRepositoryTypeORM
                .createQueryBuilder('keywords')
                .leftJoinAndSelect('keywords.users', 'users')
                .where('keywords.keywordHash = :keywordHash', { keywordHash })
                .getOneOrFail();

            return KeywordDomain.fromTypeORM(keywordEntity);
        } catch (e) {
            throw e;
        }
    }
}
