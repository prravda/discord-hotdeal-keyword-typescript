import { KeywordService } from '../../keywords/service';
import { USER_CAME_FROM } from '../../users/etc/USER_CAME_FROM';
import {
    ActionRowBuilder,
    ModalBuilder,
    ModalSubmitInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { KeywordDomain } from '../../keywords/domain/keyword';

export class KeywordCommandController {
    constructor(private readonly keywordService: KeywordService) {}

    public async getKeywordByUserId(interaction: StringSelectMenuInteraction) {
        const userId = interaction.user.id;
        const keywordsOfUser =
            await this.keywordService.getKeywordByUserIdAndSource(
                userId,
                USER_CAME_FROM.DISCORD
            );

        if (keywordsOfUser.length === 0) {
            await interaction.update('등록하신 키워드가 없습니다.');
            return;
        }

        await interaction.reply(
            `${keywordsOfUser.map(
                (keyword) => `${keyword.keyword} `
            )} 를 등록하셨습니다.`
        );
    }

    private generateKeywordInputModalWithSequence(sequence: number) {
        const keywordInputModal = new TextInputBuilder()
            .setRequired(false)
            .setCustomId(`asking-keywords-${sequence}`)
            .setLabel('알림을 받길 원하는 키워드를 입력해주세요.')
            .setStyle(TextInputStyle.Short);
        return new ActionRowBuilder().addComponents(keywordInputModal);
    }

    private generateKeywordSelectOptionsByKeywords(keywords: KeywordDomain[]) {
        return keywords.map((kw) => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(kw.keyword)
                .setValue(kw.keywordHash);
        });
    }

    public async showModalFormToInsertKeywords(
        interaction: StringSelectMenuInteraction
    ) {
        const userId = interaction.user.id;
        const keywordsOfUser =
            await this.keywordService.getKeywordByUserIdAndSource(
                userId,
                USER_CAME_FROM.DISCORD
            );

        const numberOfAvailableKeyword = 5 - keywordsOfUser.length;

        if (numberOfAvailableKeyword === 0) {
            await interaction.reply('더 이상 키워드 추가가 불가능합니다.');
        }

        const keywordInputModal = new ModalBuilder()
            .setCustomId('keyword-input-modal')
            .setTitle(`등록하고 싶은 키워드 입력`);

        for (let i = 0; i < numberOfAvailableKeyword; i++) {
            keywordInputModal.addComponents(
                // @ts-ignore
                this.generateKeywordInputModalWithSequence(i)
            );
        }

        await interaction.showModal(keywordInputModal);
    }

    public async showModalFormToDeleteKeywords(
        interaction: StringSelectMenuInteraction
    ) {
        const userId = interaction.user.id;
        const keywordsOfUser =
            await this.keywordService.getKeywordByUserIdAndSource(
                userId,
                USER_CAME_FROM.DISCORD
            );

        if (keywordsOfUser.length === 0) {
            await interaction.reply(
                '삭제할 수 있는 키워드가 없습니다. 키워드를 먼저 등록해주세요.'
            );
            return;
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('keyword-view-modal-for-delete')
            .setPlaceholder(`삭제하고 싶은 키워드 선택`)
            .setMaxValues(keywordsOfUser.length);
        select.addOptions(
            ...this.generateKeywordSelectOptionsByKeywords(keywordsOfUser)
        );

        const rows = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: '삭제할 키워드를 선택해주세요.',
            // @ts-ignore
            components: [rows],
        });
    }

    public async insertKeywordsWithUserId(
        keywords: string[],
        interaction: ModalSubmitInteraction
    ) {
        try {
            if (keywords.every((keyword) => keyword === '')) {
                await interaction.reply('키워드를 1개 이상 입력해주세요.');
                return;
            }

            if (new Set(keywords).size !== keywords.length) {
                await interaction.reply(
                    '키워드에 중복이 있습니다. 다시 한 번 확인해주세요'
                );
                return;
            }

            const userId = interaction.user.id;
            const insertResult =
                await this.keywordService.insertKeywordsWithUserId(
                    userId,
                    keywords,
                    USER_CAME_FROM.DISCORD
                );

            if (insertResult) {
                await interaction.reply(
                    `입력한 키워드 ${keywords.map(
                        (kw) => `${kw} `
                    )} 의 등록이 완료되었습니다.`
                );
            }
        } catch (e) {
            if (
                e instanceof Error &&
                e.message === 'Keyword duplication is not allowed'
            ) {
                await interaction.reply(
                    `이미 등록된 키워드를 등록하셨습니다. 다시 한 번 확인해주세요!`
                );
            }
        }
    }

    public async deleteKeywordWithUserId(
        keywordHashes: string[],
        interaction: StringSelectMenuInteraction
    ) {
        const userId = interaction.user.id;
        const deleteResult =
            await this.keywordService.deleteKeywordByUserIdAndKeywordHashes(
                userId,
                USER_CAME_FROM.DISCORD,
                keywordHashes
            );

        if (deleteResult) {
            await interaction.reply(`선택한 키워드의 삭제가 완료되었습니다.`);
        }
    }
}
