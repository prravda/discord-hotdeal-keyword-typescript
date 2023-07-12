import { KeywordRepositoryInterface } from './interfaces/keyword-repository.interface';
import { KeywordDomain } from './domain/keyword';
import { AppDataSource } from '../../infra/database/app-datasource';
import { Keyword } from './entity';
import { Repository } from 'typeorm';
import { User } from '../users/entity';
import { USER_CAME_FROM } from '../users/etc/USER_CAME_FROM';
import { createHash } from '../../infra/helpers';
import { redisConnection } from '../../infra/cache/cache-redis';

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
                        keywordHash: createHash(keyword),
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
                keywordTypeOrmEntity.keywordHash = createHash(keyword);
                if (userInDatabase) {
                    keywordTypeOrmEntity.users = [userInDatabase];
                }

                return keywordTypeOrmEntity;
            })
        );

        const result = await this.keywordRepositoryTypeORM.save<Keyword>(
            keywordEntities
        );

        const parsedToDomainObject = result.map<KeywordDomain>((res) =>
            KeywordDomain.fromTypeORM(res)
        );

        await Promise.all(
            parsedToDomainObject.map((keyword) => {
                return redisConnection.hset(
                    `${userId}-${keyword.keywordHash}`,
                    {
                        userId,
                        cameFrom,
                        keyword: keyword.keyword,
                    }
                );
            })
        );

        return parsedToDomainObject;
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

    public async deleteKeywordByUserIdAndKeywordHashes(
        userId: string,
        keywordHashes: string[],
        cameFrom: USER_CAME_FROM
    ) {
        const userEntity = await this.userRepositoryTypeORM
            .createQueryBuilder('users')
            .leftJoinAndSelect('users.keywords', 'keywords')
            .where('users.userId = :userId', { userId })
            .andWhere('users.cameFrom = :cameFrom', { cameFrom })
            .getOneOrFail();

        userEntity.keywords = userEntity.keywords.filter(
            (keyword) => !keywordHashes.includes(keyword.keywordHash)
        );

        const updateResult = await this.userRepositoryTypeORM.save(userEntity);

        // delete a user from table if this user has no subscribed keyword
        if (updateResult.keywords.length === 0) {
            await this.userRepositoryTypeORM
                .createQueryBuilder('users')
                .delete()
                .from(User)
                .where('userId = :userId', {
                    userId: updateResult.userId,
                })
                .execute();
        }

        await Promise.all(
            keywordHashes.map((kw) => {
                return redisConnection.del(`${userId}-${kw}`);
            })
        );

        // delete all keywords which no user subscribed using raw query
        await this.keywordRepositoryTypeORM.query(
            `DELETE FROM keyword WHERE NOT EXISTS (SELECT 1 FROM keyword_user WHERE keyword_user."keywordId" = keyword.id);`
        );

        return updateResult.keywords.map<KeywordDomain>((keyword) => {
            return KeywordDomain.fromTypeORMWithoutUser(keyword);
        });
    }
}
