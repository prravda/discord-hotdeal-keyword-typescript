import { Cluster } from 'ioredis';
import { KeywordSearchRepositoryInterface } from './interfaces/keyword-search.repository.interface';
import { KeywordSearchMachine } from './trie';

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
                const emptyTrieForInit = new KeywordSearchMachine();

                const serializedEmptyTrie = JSON.stringify(
                    emptyTrieForInit.toJSON()
                );
                await masterNode.set('keywords', serializedEmptyTrie);

                return serializedEmptyTrie;
            }

            // if trie on 'keywords' exists, just return it
            return serializedTrieFromMaster;
        } catch (e) {
            throw e;
        }
    }

    private async getParsedTrie(): Promise<KeywordSearchMachine> {
        try {
            const serializedTrie = await this.getSerializedTrieFromMasterNode();
            return KeywordSearchMachine.fromJSON(JSON.parse(serializedTrie));
        } catch (e) {
            throw e;
        }
    }

    private async updateTrie(updatedTrie: KeywordSearchMachine): Promise<void> {
        try {
            const serializedTrie = JSON.stringify(updatedTrie.toJSON());
            await this.keywordSearchCluster.set('keywords', serializedTrie);
        } catch (e) {
            throw e;
        }
    }

    public async insertKeywords(keywordList: string[]): Promise<void> {
        try {
            const trie = await this.getParsedTrie();
            keywordList.forEach((keyword) => trie.insert(keyword));
            await this.updateTrie(trie);
        } catch (e) {
            throw e;
        }
    }

    public async deleteKeywords(keywordList: string[]): Promise<void> {
        const trie = await this.getParsedTrie();
        keywordList.forEach((keyword) => trie.delete(keyword));
        await this.updateTrie(trie);
    }
}
