import { Application } from 'express';
import { getMetadataArgsStorage } from 'routing-controllers';
import { getMetadataStorage } from 'class-validator';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import { apiReference } from '@scalar/express-api-reference';
import controllers from '../api/controllers/index.js';

export function generateOpenAPISpec() {
    const schemas = validationMetadatasToSchemas({
        classValidatorMetadataStorage: getMetadataStorage(),
        refPointerPrefix: '#/components/schemas/',
    });

    return routingControllersToSpec(
        getMetadataArgsStorage(),
        {
            routePrefix: '/api',
            controllers,
        },
        {
            components: {
                schemas: schemas as any,
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
            info: {
                title: `${process.env.APP_NAME} API`,
                version: `${process.env.APP_VERSION}`,
            },
        }
    );
}

/**
 * Setup OpenAPI documentation routes with Scalar
 */
export function setupOpenAPIDocs(app: Application) {
    const spec = generateOpenAPISpec();

    // Serve routing-controllers OpenAPI spec as JSON
    app.get('/docs/openapi.json', (req, res) => {
        res.json(spec);
    });

    // Serve Scalar API Reference with multiple sources
    app.use(
        '/docs',
        apiReference({
            sources: [
                { url: '/docs/openapi.json', title: 'API' },
                { url: '/api/auth/open-api/generate-schema', title: 'Auth' },
            ],
            theme: 'elysiajs',
        })
    );
}
