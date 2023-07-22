import 'dotenv/config';
import Joi from 'joi';

const envListSchema = Joi.object({
    DATABASE_USER: Joi.string().required().description('database username'),
    DATABASE_PASSWORD: Joi.string().required().description('database password'),
    DATABASE_NAME: Joi.string().required().description('database table name'),

    REDIS_PASSWORD: Joi.string().required().description('redis password'),

    DISCORD_TOKEN: Joi.string()
        .required()
        .description('discord bot application token'),
    DISCORD_API_VERSION: Joi.string()
        .required()
        .description('discord API version number as string'),
    DISCORD_APPLICATION_ID: Joi.string()
        .required()
        .description('discord application id as string'),
    DISCORD_GUILD_ID: Joi.string()
        .required()
        .description('discord server(guild) id'),
    DISCORD_CLIENT_ID: Joi.string()
        .required()
        .description(`discord bot's client id`),
    DISCORD_CLIENT_SECRET: Joi.string()
        .required()
        .description(`discord bot's client secret token`),
}).unknown();

const validateEnvList = () => {
    const { error, value } = envListSchema.validate(process.env);

    if (error) {
        throw new Error(`Validation Error: ${error.message}`);
    }

    return value;
};

const afterValidate = validateEnvList();

export const ENV_LIST = {
    DATABASE_USER: afterValidate.DATABASE_USER as string,
    DATABASE_PASSWORD: afterValidate.DATABASE_PASSWORD as string,
    DATABASE_NAME: afterValidate.DATABASE_NAME as string,

    REDIS_PASSWORD: afterValidate.REDIS_PASSWORD as string,

    DISCORD_TOKEN: afterValidate.DISCORD_TOKEN as string,
    DISCORD_API_VERSION: afterValidate.DISCORD_API_VERSION as string,
    DISCORD_APPLICATION_ID: afterValidate.DISCORD_APPLICATION_ID as string,
    DISCORD_GUILD_ID: afterValidate.DISCORD_GUILD_ID as string,
    DISCORD_CLIENT_ID: afterValidate.DISCORD_CLIENT_ID as string,
    DISCORD_CLIENT_SECRET: afterValidate.DISCORD_CLIENT_SECRET as string,
};
