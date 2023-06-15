import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from './infra/database/app-datasource';
import { KeywordRepository } from './src/keywords/repository';
import { KeywordService } from './src/keywords/service';
import { USER_CAME_FROM } from './src/users/etc/USER_CAME_FROM';
import { DiscordEntryPoint } from './src/discord/entrypoint';
import { CommandManager } from './src/discord/command-manager';
import { ClientInstance } from './src/discord/client';
import { KeywordCommand } from './src/discord/slash/keyword';
import { KeywordCommandController } from './src/discord/controller/keyword-command.controller';

const bootstrap = async () => {
    try {
        // init database instance
        await AppDataSource.getDataSource().initialize();

        // init discord application
        const slashCommands = [KeywordCommand];
        const discordApp = new DiscordEntryPoint(
            new KeywordCommandController(
                new KeywordService(new KeywordRepository())
            ),
            new CommandManager(slashCommands),
            ClientInstance.getClient()
        );
        await discordApp.startClient();
    } catch (e) {
        console.error(e);
        throw e;
    }
};

bootstrap();
