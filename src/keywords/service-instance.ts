import { KeywordService } from './service';
import { KeywordRepository } from './repository';
import { KeywordSearchRepository } from '../keyword-search/keyword-search.repository';
import { keywordSearchCluster } from '../../infra/cache/keyword-search-cluster';

export class ServiceInstance {
    private static serviceInstance: KeywordService;

    public static getService() {
        if (!this.serviceInstance) {
            this.serviceInstance = new KeywordService(
                new KeywordRepository(),
                new KeywordSearchRepository(keywordSearchCluster)
            );
        }
        return this.serviceInstance;
    }
}
