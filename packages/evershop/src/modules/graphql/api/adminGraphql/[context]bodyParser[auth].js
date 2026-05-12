import bodyParser from 'body-parser';

// Body parsing for the admin GraphQL endpoint.
//
// We defend against two failure modes that show up as 'stream is not
// readable' in the logs:
//
// 1. The global bodyParser already drained the request stream — skip
//    re-parsing if request.body is already a parsed object.
// 2. The client aborted the connection mid-read (urql cancels stale queries
//    when components unmount; the dashboard fans out ~10 queries on load).
//    In that case bodyParser surfaces a 500 even though the response will
//    never be sent. Swallow that specific error and end the chain quietly.
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
      // The client is gone; nothing useful we can do except end the chain
      // without logging a misleading error.
      return;
    }
    next(err);
  });
};
