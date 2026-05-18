import { setPageMetaInfo } from '../../../../cms/services/pageMetaInfo.js';

export default (request) => {
  setPageMetaInfo(request, {
    title: 'Crear un cupón nuevo',
    description: 'Crear un cupón nuevo'
  });
};
