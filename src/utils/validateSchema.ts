import Joi from "joi";

export const attribSchema = Joi.object({
    name: Joi.string().required(),
    condition: Joi.string().required(),
    conditionDescription: Joi.string(),
    defaultValue: Joi.string(),
});

export const resourceSchema = Joi.object({
    memory: Joi.number().required(),
    cpu: Joi.number().required(),
    disk: Joi.number(),
});

export const volumeSchema = Joi.object({
    mountPath: Joi.string().required(),
    name: Joi.string().required(),
});

export const envSchema = Joi.object({
    name: Joi.string().required(),
    value: Joi.string().required(),
});

export const portSchema = Joi.object({
    containerPort: Joi.string().pattern(new RegExp("^[0-9]+$")),
    servicePort: Joi.string().pattern(new RegExp("^[0-9]+$")),
    hostURL: Joi.object({
        urlString: Joi.string(),
        createMode: Joi.string().valid("CUSTOM", "CREATE"),
    }),
});

export const appPayloadSchema = Joi.object({
    appName: Joi.string().required(),
    nftID: Joi.string().required(),
    namespace: Joi.string().required(),
    containers: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().required(),
                image: Joi.string().required(),
                tcpPorts: Joi.array().items(portSchema).required(),
                httpPorts: Joi.array().items(portSchema).required(),
                args: Joi.array().items(Joi.string()),
                commands: Joi.array().items(Joi.string()),
                envVariables: Joi.array().items(envSchema),
                volumeMounts: Joi.array().items(volumeSchema),
                resourceLimits: resourceSchema.required(),
                resourceRequests: resourceSchema.required(),
            }),
        )
        .required(),
    replicaCount: Joi.number(),
    whitelistedIps: Joi.array().items(Joi.string()),
    persistence: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().required(),
                accessMode: Joi.string().valid("ReadWriteOnce").required(),
                storageType: Joi.string()
                    .valid("standard", "ssd-sc")
                    .required(),
                storageSize: Joi.string(),
            }),
        )
        .required(),
    status: Joi.string().allow(""),
    privateImage: Joi.object({
        registry: Joi.string().required(),
        username: Joi.string().required(),
        password: Joi.string().required(),
    }),
    attribVarList: Joi.array().items(attribSchema),
});

export const appModifierSchema = Joi.object({
    modAttribVar: Joi.object()
        .pattern(/^[a-zA-Z][a-zA-Z0-9]*$/, Joi.string())
        .required(),
    contractParam: {
        resourceCount: Joi.array().items(Joi.number()),
        resourceType: Joi.array().items(Joi.number()),
        multiplier: Joi.object().pattern(
            /^.*$/,
            Joi.array().items(Joi.number()),
        ),
    },
    misc: Joi.any().allow({}).optional(),
    loggerURL: Joi.string().allow(""),
});
