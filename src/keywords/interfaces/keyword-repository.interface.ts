import { KeywordDomain } from '../domain/keyword';
import { USER_CAME_FROM } from '../../users/etc/USER_CAME_FROM';

export interface KeywordRepositoryInterface {
    getKeywordAndUsersByHash(keywordHash: string): Promise<KeywordDomain>;
    getAllKeywordsAndUsers(): Promise<KeywordDomain[]>;
    insertKeywordsWithUserId(
        userId: string,
        keywords: string[],
        cameFrom: USER_CAME_FROM
    ): Promise<KeywordDomain[]>;
    getAllKeywords(): Promise<KeywordDomain[]>;
    getKeywordsByUserIdAndSource(
        userId: string,
        cameFrom: USER_CAME_FROM
    ): Promise<KeywordDomain[]>;
}
