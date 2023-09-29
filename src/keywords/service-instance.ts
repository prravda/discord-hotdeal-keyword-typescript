import { KeywordService } from './service';
import { KeywordRepository } from './repository';
import { KeywordSearchRepository } from '../keyword-search/keyword-search.repository';
import { keywordSearchCluster } from '../../infra/cache/keyword-search-cluster';
import { AppDataSource } from '../../infra/database/app-datasource';
import { Keyword } from './entity';
import { User } from '../users/entity';

export class ServiceInstance {
    private static serviceInstance: KeywordService;

    public static getService() {
        if (!this.serviceInstance) {
            this.serviceInstance = new KeywordService(
                new KeywordRepository(
                    AppDataSource.getDataSource().getRepository<Keyword>(
                        Keyword
                    ),
                    AppDataSource.getDataSource().getRepository<User>(User),
                    new KeywordSearchRepository(keywordSearchCluster)
                )
            );
        }
        return this.serviceInstance;
    }
}
