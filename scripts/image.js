pipy({
    _validRepoPrefixes: [
      'docker.io',
      'k8s.gcr.io'
    ],
    _invalidTagSuffixes: [
      ':latest'
    ],
  })
  
  .listen(os.env.LISTENING_PORT || 6443)
    .acceptTLS('tls-offloaded', {
      certificate: {
        cert: new crypto.Certificate(os.readFile('/certs/tls.crt')),
        key: new crypto.PrivateKey(os.readFile('/certs/tls.key')),
      }
    })

  .pipeline('tls-offloaded')
    .decodeHTTPRequest()
    .replaceMessage(
      (msg, req, result, invalids, reason) => (
        req = JSON.decode(msg.body),
        invalids = req.request.object.spec.containers.find(container => (//verify repository
          (!_validRepoPrefixes.find(prefix => container.image.startsWith(prefix)) ? (
            reason = `${container.image} repo not start with any repo [${_validRepoPrefixes.join(', ')}]`,
            console.log(reason),
            true
          ) : (false))
          ||
          (_invalidTagSuffixes.find(suffix => //verify tag
            container.image.endsWith(suffix) ? (
              reason = `${container.image} tag end with ${suffix}`,
              true
            ) : false
            ) ? (
            console.log(reason),
            true
          ) : (false)
        ))),
        invalids != undefined ? (
          result = {
            "apiVersion": "admission.k8s.io/v1",
            "kind": "AdmissionReview",
            "response": {
                "allowed": false,
                "uid": req.request.uid,
                "status": {
                    "reason": reason,
                },
            },
          }
        ) : (
          result = {
            "apiVersion": "admission.k8s.io/v1",
            "kind": "AdmissionReview",
            "response": {
                "allowed": true,
                "uid": req.request.uid
            },
          }
        ),

        console.log(JSON.encode(result)),
        
        new Message({
          'status' : 200,
          'headers': {
            'Content-Type': 'application/json',
            'Connection': 'Close'
          }
          }, JSON.encode(result))
          
      )
    )
    .encodeHTTPResponse()