import { KeywordDomain } from '../../domain/keyword';
import { USER_CAME_FROM } from '../../../users/etc/USER_CAME_FROM';
import { UserDomain } from '../../../users/domain/user';
import { KeywordRepositoryInterface } from '../../interfaces/keyword-repository.interface';

export class KeywordMockRepository implements KeywordRepositoryInterface {
    private mockKeywordRepository: KeywordDomain[];

    constructor() {
        this.mockKeywordRepository = [];
    }

    async getAllKeywords(): Promise<KeywordDomain[]> {
        return Promise.resolve(this.mockKeywordRepository);
    }

    async getAllKeywordsAndUsers(): Promise<KeywordDomain[]> {
        return Promise.resolve(this.mockKeywordRepository);
    }

    async getKeywordAndUsersByHash(
        keywordHash: string
    ): Promise<KeywordDomain> {
        return Promise.resolve(
            this.mockKeywordRepository.filter(
                (keyword) => keyword.keywordHash == keywordHash
            )[0]
        );
    }

    async getKeywordsByUserIdAndSource(
        userId: string,
        cameFrom: USER_CAME_FROM
    ): Promise<KeywordDomain[]> {
        const filteredKeywords: KeywordDomain[] = [];
        for (const keyword of this.mockKeywordRepository) {
            for (const user of keyword.users) {
                if (user.userId === userId && user.cameFrom === cameFrom) {
                    filteredKeywords.push(keyword);
                }
            }
        }

        return Promise.resolve(filteredKeywords);
    }

    async insertKeywordsWithUserId(
        userId: string,
        keywords: string[],
        cameFrom: USER_CAME_FROM
    ): Promise<KeywordDomain[]> {
        const userEntity = new UserDomain(1, userId, USER_CAME_FROM.DISCORD);

        const keywordEntityWithUser = keywords.map<KeywordDomain>(
            (keywordToInsert) => {
                const keywordInDatabase = this.mockKeywordRepository.filter(
                    (keyword) => keyword.keywordHash === keywordToInsert
                );

                if (keywordInDatabase.length !== 0) {
                    keywordInDatabase[0].users.push(userEntity);
                    return keywordInDatabase[0];
                }

                const keywordEntity = new KeywordDomain(
                    1,
                    keywordToInsert,
                    keywordToInsert,
                    [userEntity]
                );

                this.mockKeywordRepository.push(keywordEntity);
                return keywordEntity;
            }
        );

        return Promise.resolve(keywordEntityWithUser);
    }
}
