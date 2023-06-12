// TODO: implement service logic using domain, and entity
import { KeywordRepositoryInterface } from './interfaces/keyword-repository.interface';
import { USER_CAME_FROM } from '../users/etc/USER_CAME_FROM';

export class KeywordService {
    constructor(
        private readonly keywordRepository: KeywordRepositoryInterface
    ) {}

    public async getAllKeywordsAndUsers() {
        return await this.keywordRepository.getAllKeywordsAndUsers();
    }

    public async insertKeywordsWithUserId(
        userId: string,
        keywords: string[],
        cameFrom: USER_CAME_FROM
    ) {
        return await this.keywordRepository.insertKeywordsWithUserId(
            userId,
            keywords,
            cameFrom
        );
    }

    public async getKeywordAndUsersByHash(keywordHash: string) {
        return await this.keywordRepository.getKeywordAndUsersByHash(
            keywordHash
        );
    }

    public async getAllKeywords() {
        return await this.keywordRepository.getAllKeywords();
    }
}
