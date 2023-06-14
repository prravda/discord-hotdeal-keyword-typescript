import {
    Column,
    Entity,
    ManyToMany,
    JoinTable,
    PrimaryGeneratedColumn,
    Index,
} from 'typeorm';
import { User } from '../users/entity';

@Entity()
@Index(['keywordHash'])
export class Keyword {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    keyword: string;

    @Column()
    keywordHash: string;

    @ManyToMany(() => User, { cascade: true })
    @JoinTable()
    users: User[];
}
