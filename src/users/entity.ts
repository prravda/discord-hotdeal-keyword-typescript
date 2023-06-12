import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Keyword } from '../keywords/entity';
import { USER_CAME_FROM } from './etc/USER_CAME_FROM';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: string;

    @Column()
    cameFrom: USER_CAME_FROM;

    @ManyToMany(() => Keyword)
    keywords: Keyword[];
}
