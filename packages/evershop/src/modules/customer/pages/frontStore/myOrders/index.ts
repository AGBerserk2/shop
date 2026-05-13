import { translate } from '../../../../../lib/locale/translate/translate.js';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';
import { EvershopResponse } from '../../../../../types/response.js';
import { setPageMetaInfo } from '../../../../cms/services/pageMetaInfo.js';

export default (request, response: EvershopResponse, next) => {
  if (!request.isCustomerLoggedIn()) {
    response.redirect(buildUrl('login'));
  } else {
    setPageMetaInfo(request, {
      title: translate('Mis pedidos'),
      description: translate('Historial de pedidos en Anroy')
    });
    next();
  }
};
