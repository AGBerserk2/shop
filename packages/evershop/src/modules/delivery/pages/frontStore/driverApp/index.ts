import { setPageMetaInfo } from '../../../../cms/services/pageMetaInfo.js';

// Public page — no login. The unguessable token in the URL is the
// credential; the page component validates it via GraphQL.
export default (request, response, next) => {
  setPageMetaInfo(request, {
    title: 'Entrega · Anroy',
    description: 'Seguimiento de entrega'
  });
  next();
};
