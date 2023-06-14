import { KeywordService } from '../service';
import { KeywordMockRepository } from './mocks/mock.repository';
import { USER_CAME_FROM } from '../../users/etc/USER_CAME_FROM';

describe('Test: service layer of keyword domain', () => {
    let testInstance: KeywordService;

    const MOCK_USER_ID_SET_ONE = 'discord-mock-user-hv';
    const MOCK_USER_ID_SET_TWO = 'discord-mock-user-svm';

    const MOCK_USER_CAME_FROM = USER_CAME_FROM.DISCORD;
    const MOCK_LIST_OF_KEYWORDS_SET_ONE = ['문화상품권', '문상', '컬쳐랜드'];
    const MOCK_LIST_OF_KEYWORDS_SET_TWO = [
        '개사료',
        '고양이사료',
        '인간사료',
        '문화상품권',
    ];

    beforeEach(() => {
        testInstance = new KeywordService(new KeywordMockRepository());
    });

    it('should be defined', () => {
        expect(testInstance).toBeDefined();
    });

    it('should throw an error after the sum of existing keywords and going to be inserted keywords is larger than 5', async () => {
        await testInstance.insertKeywordsWithUserId(
            MOCK_USER_ID_SET_ONE,
            MOCK_LIST_OF_KEYWORDS_SET_ONE,
            MOCK_USER_CAME_FROM
        );

        await expect(async () => {
            await testInstance.insertKeywordsWithUserId(
                MOCK_USER_ID_SET_ONE,
                MOCK_LIST_OF_KEYWORDS_SET_TWO,
                MOCK_USER_CAME_FROM
            );
        }).rejects.toThrowError(
            'Total number of keyword can not larger than 5'
        );
    });

    it('should throw an error when user try to enroll existing keyword', async () => {
        await testInstance.insertKeywordsWithUserId(
            MOCK_USER_ID_SET_ONE,
            MOCK_LIST_OF_KEYWORDS_SET_ONE,
            MOCK_USER_CAME_FROM
        );

        await expect(async () => {
            await testInstance.insertKeywordsWithUserId(
                MOCK_USER_ID_SET_ONE,
                [MOCK_LIST_OF_KEYWORDS_SET_ONE[0]],
                MOCK_USER_CAME_FROM
            );
        }).rejects.toThrowError('Keyword duplication is not allowed');
    });

    it('should insert successfully keywords with userId and keywords', async () => {
        const insertResult = await testInstance.insertKeywordsWithUserId(
            MOCK_USER_ID_SET_ONE,
            MOCK_LIST_OF_KEYWORDS_SET_ONE,
            MOCK_USER_CAME_FROM
        );

        expect(insertResult.length).not.toBe(0);
    });

    it('should retrieve keywords without any error from empty repository', async () => {
        const result = await testInstance.getAllKeywords();
        expect(result.length).toBe(0);
    });

    it('should update keywords of user successfully after another user enroll an existing keyword', async () => {
        await testInstance.insertKeywordsWithUserId(
            MOCK_USER_ID_SET_ONE,
            MOCK_LIST_OF_KEYWORDS_SET_ONE,
            MOCK_USER_CAME_FROM
        );

        const insertResult = await testInstance.insertKeywordsWithUserId(
            MOCK_USER_ID_SET_TWO,
            [MOCK_LIST_OF_KEYWORDS_SET_ONE[0]],
            MOCK_USER_CAME_FROM
        );

        expect(insertResult[0].users.length).not.toBe(1);
    });

    it('should not allow the duplicate of keyword', async () => {
        await testInstance.insertKeywordsWithUserId(
            MOCK_USER_ID_SET_ONE,
            MOCK_LIST_OF_KEYWORDS_SET_ONE,
            MOCK_USER_CAME_FROM
        );

        await testInstance.insertKeywordsWithUserId(
            MOCK_USER_ID_SET_TWO,
            MOCK_LIST_OF_KEYWORDS_SET_TWO,
            MOCK_USER_CAME_FROM
        );

        const keywordsInDatabase = await testInstance.getAllKeywords();
        const keywordsWithoutDuplicates = new Set([
            ...MOCK_LIST_OF_KEYWORDS_SET_ONE,
            ...MOCK_LIST_OF_KEYWORDS_SET_TWO,
        ]);

        expect(keywordsInDatabase.length).toBe(keywordsWithoutDuplicates.size);
    });

    it('should retrieve keywords after successful insertion', async () => {
        await testInstance.insertKeywordsWithUserId(
            MOCK_USER_ID_SET_ONE,
            MOCK_LIST_OF_KEYWORDS_SET_ONE,
            MOCK_USER_CAME_FROM
        );

        const retrieveResult = await testInstance.getAllKeywords();
        expect(retrieveResult.length).not.toBe(0);
    });
});
