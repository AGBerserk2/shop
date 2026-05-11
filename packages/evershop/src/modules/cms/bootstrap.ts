import path from 'path';
import { JSONSchemaType } from 'ajv';
import config from 'config';
import { CONSTANTS } from '../../lib/helpers.js';
import { defaultPaginationFilters } from '../../lib/util/defaultPaginationFilters.js';
import { merge } from '../../lib/util/merge.js';
import { addProcessor } from '../../lib/util/registry.js';
import { registerWidget } from '../../lib/widget/widgetManager.js';
import { registerDefaultPageCollectionFilters } from '../../modules/cms/services/registerDefaultPageCollectionFilters.js';
import { registerDefaultWidgetCollectionFilters } from '../../modules/cms/services/registerDefaultWidgetCollectionFilters.js';
import { Route } from '../../types/route.js';

export default () => {
  addProcessor('configurationSchema', (schema) => {
    merge(schema, {
      properties: {
        themeConfig: {
          type: 'object',
          properties: {
            logo: {
              type: 'object',
              properties: {
                alt: {
                  type: 'string'
                },
                src: {
                  type: 'string',
                  format: 'uri-reference'
                },
                width: {
                  type: 'integer'
                },
                height: {
                  type: 'integer'
                }
              }
            },
            headTags: {
              type: 'object',
              properties: {
                links: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      rel: {
                        type: 'string'
                      },
                      href: {
                        type: 'string',
                        format: 'uri-reference'
                      }
                    },
                    required: ['rel', 'href']
                  }
                },
                metas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string'
                      },
                      content: {
                        type: 'string'
                      }
                    },
                    required: ['name', 'content']
                  }
                },
                scripts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      src: {
                        type: 'string',
                        format: 'uri-reference'
                      },
                      type: {
                        type: 'string'
                      },
                      async: {
                        type: 'boolean'
                      },
                      defer: {
                        type: 'boolean'
                      },
                      crossorigin: {
                        type: 'string'
                      },
                      integrity: {
                        type: 'string'
                      },
                      noModule: {
                        type: 'string'
                      },
                      nonce: {
                        type: 'string'
                      }
                    },
                    required: ['src']
                  }
                },
                bases: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      href: {
                        type: 'string',
                        format: 'uri-reference'
                      }
                    },
                    required: ['href']
                  }
                }
              }
            }
          }
        },
        system: {
          type: 'object',
          properties: {
            file_storage: {
              oneOf: [
                { type: 'string', enum: ['local'] },
                {
                  type: 'object',
                  properties: { driver: { type: 'string' } },
                  required: ['driver']
                }
              ]
            }
          }
        }
      }
    });
    return schema;
  });

  const defaultThemeConfig = {
    logo: {
      alt: undefined,
      src: undefined,
      width: undefined,
      height: undefined
    },
    headTags: {
      links: [],
      metas: [],
      scripts: [],
      bases: []
    },
    copyRight: `© 2022 Evershop. All Rights Reserved.`
  };
  config.util.setModuleDefaults('themeConfig', defaultThemeConfig);

  // Set the default file storage to local
  config.util.setModuleDefaults('system', {
    file_storage: 'local'
  });

  registerWidget({
    type: 'text_block',
    settingComponent: path.resolve(
      CONSTANTS.MODULESPATH,
      'cms/components/TextBlockSetting.js'
    ),
    component: path.resolve(
      CONSTANTS.MODULESPATH,
      'cms/components/TextBlock.js'
    ),
    name: 'Text block',
    description: 'Add rich text content',
    defaultSettings: {
      className: 'page-width'
    },
    enabled: true
  });

  registerWidget({
    type: 'basic_menu',
    settingComponent: path.resolve(
      CONSTANTS.MODULESPATH,
      'cms/components/BasicMenuSetting.js'
    ),
    component: path.resolve(
      CONSTANTS.MODULESPATH,
      'cms/components/BasicMenu.js'
    ),
    name: 'Menu',
    description: 'Navigation links',
    defaultSettings: {},
    enabled: true
  });

  registerWidget({
    type: 'banner',
    settingComponent: path.resolve(
      CONSTANTS.MODULESPATH,
      'cms/components/BannerSetting.js'
    ),
    component: path.resolve(CONSTANTS.MODULESPATH, 'cms/components/Banner.js'),
    defaultSettings: {},
    name: 'Banner',
    description: 'Image with call-to-action',
    enabled: true
  });

  registerWidget({
    type: 'simple_slider',
    settingComponent: path.resolve(
      CONSTANTS.MODULESPATH,
      'cms/components/SlideshowSetting.js'
    ),
    component: path.resolve(
      CONSTANTS.MODULESPATH,
      'cms/components/Slideshow.js'
    ),
    defaultSettings: {},
    name: 'Simple Slideshow',
    description: 'Rotating image carousel',
    enabled: true
  });

  // Reigtering the default filters for cms page collection
  addProcessor(
    'cmsPageCollectionFilters',
    registerDefaultPageCollectionFilters,
    1
  );
  addProcessor<Array<any>>(
    'cmsPageCollectionFilters',
    (filters) => [...filters, ...defaultPaginationFilters],
    2
  );

  // Reigtering the default filters for widget collection
  addProcessor<Array<any>>(
    'widgetCollectionFilters',
    registerDefaultWidgetCollectionFilters,
    1
  );
  addProcessor<Array<any>>(
    'widgetCollectionFilters',
    (filters) => [...filters, ...defaultPaginationFilters],
    2
  );

  addProcessor('payloadSchema', function (schema: JSONSchemaType<any>) {
    const ctx = this as { route: Route };
    const route = ctx.route;
    if (route.id === 'createWidget' || route.id === 'updateWidget') {
      schema.properties.settings = {
        properties: {
          text: {
            type: 'string',
            skipEscape: true
          }
        }
      };
    }
    return schema;
  });
};
