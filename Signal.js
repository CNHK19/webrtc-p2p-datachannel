
function getSignalEntity(req, params,bReq) {
    return { breq: bReq, signal: req, params: params };
}

exports.createSignal=getSignalEntity