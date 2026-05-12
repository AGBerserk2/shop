import bodyParser from 'body-parser';

// Skip if the request body was already parsed upstream — calling
// bodyParser.json() twice on the same request raises
// "stream is not readable" because the underlying stream has been drained.
export default (request, response, next) => {
  if (request.body && typeof request.body === 'object') {
    next();
    return;
  }
  bodyParser.json({ inflate: false })(request, response, next);
};
