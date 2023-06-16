import { SlashCommand } from '../../../types';
import {
    ActionRowBuilder,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputStyle,
} from 'discord.js';

export const KeywordCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName('키워드')
        .setDescription('핫딜 키워드를 관리합니다.'),
    execute: async (interaction) => {
        const availableOptions = new StringSelectMenuBuilder()
            .setCustomId('keyword-management-command')
            .setPlaceholder('실행하고자 하는 명령을 선택해주세요.')
            .setOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('등록')
                    .setValue('insert')
                    .setDescription('키워드를 등록합니다.'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('조회')
                    .setValue('retrieve')
                    .setDescription('등록된 키워드를 확인합니다.'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('삭제')
                    .setValue('delete')
                    .setDescription('등록한 키워드를 삭제합니다.')
            );

        const rows = new ActionRowBuilder().addComponents(availableOptions);

        await interaction.reply({
            content: '실행하고자 하는 명령을 선택해주세요',
            // @ts-ignore
            components: [rows],
        });
    },
};
