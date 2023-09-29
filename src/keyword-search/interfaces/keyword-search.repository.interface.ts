export interface KeywordSearchRepositoryInterface {
    insertKeywords(keywordList: string[]): Promise<void>;
    deleteKeywords(keywordList: string[]): Promise<void>;
}
