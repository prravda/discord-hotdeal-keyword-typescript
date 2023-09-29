import { Cluster } from 'ioredis';
import { KeywordSearchRepositoryInterface } from './interfaces/keyword-search.repository.interface';
import { TyniSearch } from 'tynisearch';

export class KeywordSearchRepository
    implements KeywordSearchRepositoryInterface
{
    constructor(private readonly keywordSearchCluster: Cluster) {}

    private async getSerializedTrieFromMasterNode(): Promise<string> {
        try {
            const [masterNode] = this.keywordSearchCluster.nodes('master');
            const serializedTrieFromMaster = await masterNode.get('keywords');

            // if trie on 'keywords' does not exist, create a new one and set it
            if (!serializedTrieFromMaster) {
                const emptyTrieForInit = new TyniSearch();

                const serializedEmptyTrie = emptyTrieForInit.serialize();
                await masterNode.set('keywords', serializedEmptyTrie);

                return serializedEmptyTrie;
            }

            return serializedTrieFromMaster;
        } catch (e) {
            throw e;
        }
    }

    private async getParsedTrie(): Promise<TyniSearch> {
        try {
            const serializedTrie = await this.getSerializedTrieFromMasterNode();
            return TyniSearch.deserialize(serializedTrie);
        } catch (e) {
            throw e;
        }
    }

    private async updateTrie(updatedTrie: TyniSearch): Promise<void> {
        try {
            const serializedTrie = updatedTrie.serialize();
            await this.keywordSearchCluster.set('keywords', serializedTrie);
        } catch (e) {
            throw e;
        }
    }

    public async insertKeywords(keywordList: string[]): Promise<void> {
        try {
            const trie = await this.getParsedTrie();
            trie.insert(keywordList);
            await this.updateTrie(trie);
        } catch (e) {
            throw e;
        }
    }

    public async deleteKeywords(keywordList: string[]): Promise<void> {
        const trie = await this.getParsedTrie();
        trie.delete(keywordList);
        await this.updateTrie(trie);
    }
}
