import { KeywordRepositoryInterface } from './interfaces/keyword-repository.interface';
import { KeywordDomain } from './domain/keyword';
import { Keyword } from './entity';
import { Repository } from 'typeorm';
import { User } from '../users/entity';
import { USER_CAME_FROM } from '../users/etc/USER_CAME_FROM';
import { createHash } from '../../infra/helpers';

import { KeywordSearchRepositoryInterface } from '../keyword-search/interfaces/keyword-search.repository.interface';

export class KeywordRepository implements KeywordRepositoryInterface {
    constructor(
        private keywordRepositoryTypeORM: Repository<Keyword>,
        private userRepositoryTypeORM: Repository<User>,
        private keywordSearchRepository: KeywordSearchRepositoryInterface
    ) {}

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

        const keywordsNotEnrolledYet: string[] = [];

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

                keywordsNotEnrolledYet.push(keyword);

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

        await this.keywordSearchRepository.insertKeywords(
            keywordsNotEnrolledYet
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

    private async deleteOrphanKeywords() {
        const baseQueryBuilder =
            this.keywordRepositoryTypeORM.createQueryBuilder('keyword');

        const keywordSelectQueryBuilder = baseQueryBuilder
            .delete()
            .from<Keyword>('keyword')
            .where(
                'NOT EXISTS' +
                    baseQueryBuilder
                        .subQuery()
                        .select('1')
                        .from('keyword_user', 'keyword_user')
                        .where(`keyword_user."keywordId" = keyword.id`)
                        .getQuery()
            )
            .returning('keyword');

        const deleteResult = await keywordSelectQueryBuilder.execute();

        const deletedKeywordList = deleteResult.raw as { keyword: string }[];

        const keywords = deletedKeywordList.map<string>(
            (keyword) => keyword.keyword
        );

        await this.keywordSearchRepository.deleteKeywords(keywords);
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

        // delete orphan keywords
        await this.deleteOrphanKeywords();

        return updateResult.keywords.map<KeywordDomain>((keyword) => {
            return KeywordDomain.fromTypeORMWithoutUser(keyword);
        });
    }
}
