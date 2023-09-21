import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from './infra/database/app-datasource';
import { DiscordEntryPoint } from './src/discord/entrypoint';
import { CommandManager } from './src/discord/command-manager';
import { ClientInstance } from './src/discord/client';
import { KeywordCommand } from './src/discord/slash/keyword';
import { KeywordCommandController } from './src/discord/controller/keyword-command.controller';
import { ServiceInstance } from './src/keywords/service-instance';

const bootstrap = async () => {
    try {
        // init database instance
        await AppDataSource.getDataSource().initialize();

        // init discord application
        const slashCommands = [KeywordCommand];
        const discordApp = new DiscordEntryPoint(
            new KeywordCommandController(ServiceInstance.getService()),
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
