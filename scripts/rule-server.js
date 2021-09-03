pipy({
  _RULE_FILENAME: 'rule.js',
  _serveFile: (req, type, filename) => (
    filename = req.head.path.substring(6),
    os.stat(filename) ? (
      new Message(
        {
          bodiless: req.head.method === 'HEAD',
          headers: {
            'etag': os.stat(filename)?.mtime | 0,
            'content-type': type,
          },
        },
        req.head.method === 'HEAD' ? null : os.readFile(filename),
      )
    ) : (
      new Message({ status: 404 }, `rule file ${filename} not found`)
    )
  ),
  _router: new algo.URLRouter({
    '/rule/*': req => _serveFile(req, 'application/json'),
    '/*': () => new Message({ status: 404 }, 'Not found'),
  }),
})
  .listen(9999)
    .serveHTTP(
      req => (
        _router.find(req.head.path)(req)
      )
    )