import bodyParser from 'body-parser';

// See adminGraphql/[context]bodyParser[auth].js for the rationale — same
// double-parse + aborted-stream defense applied to the storefront endpoint.
export default (request, response, next) => {
  if (request.body && typeof request.body === 'object') {
    next();
    return;
  }
  if (request.destroyed || request.aborted || request.readableEnded) {
    next();
    return;
  }
  bodyParser.json({ inflate: false })(request, response, (err) => {
    if (err && /stream is not readable|aborted/i.test(err.message || '')) {
      return;
    }
    next(err);
  });
};
