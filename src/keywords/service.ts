import { KeywordRepositoryInterface } from './interfaces/keyword-repository.interface';
import { USER_CAME_FROM } from '../users/etc/USER_CAME_FROM';

export class KeywordService {
    constructor(
        private readonly keywordRepository: KeywordRepositoryInterface
    ) {}

    public async getAllKeywordsAndUsers() {
        try {
            return await this.keywordRepository.getAllKeywordsAndUsers();
        } catch (e) {
            throw e;
        }
    }

    public async insertKeywordsWithUserId(
        userId: string,
        keywords: string[],
        cameFrom: USER_CAME_FROM
    ) {
        try {
            const keywordsOfUser =
                await this.keywordRepository.getKeywordsByUserIdAndSource(
                    userId,
                    cameFrom
                );

            if (keywordsOfUser.length + keywords.length >= 5) {
                throw new Error(
                    'Total number of keyword can not larger than 5'
                );
            }

            for (const existingKeyword of keywordsOfUser) {
                if (keywords.includes(existingKeyword.keyword)) {
                    throw new Error('Keyword duplication is not allowed');
                }
            }

            return await this.keywordRepository.insertKeywordsWithUserId(
                userId,
                keywords,
                cameFrom
            );
        } catch (e) {
            throw e;
        }
    }

    public async getKeywordAndUsersByHash(keywordHash: string) {
        try {
            return await this.keywordRepository.getKeywordAndUsersByHash(
                keywordHash
            );
        } catch (e) {
            throw e;
        }
    }

    public async getAllKeywords() {
        try {
            return await this.keywordRepository.getAllKeywords();
        } catch (e) {
            throw e;
        }
    }
}
