import { register } from '@lobechat/observability-otel/node';

import pkg from '../package.json';

register({ version: pkg.version });
