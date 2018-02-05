import superagent from 'superagent';

export const INTERFACE_PREFIX = '';

export const UPLOAD_ADDRESS = `${INTERFACE_PREFIX}open/upload/picture`;

export const DOWNLOAD_ADDRESS = `${INTERFACE_PREFIX}open/download`;

const suffix = '.html';

export const ROUTES = {
    LOGIN: `login${suffix}`,
    SETTING: `setting${suffix}`,
    QUESTIONS: `questions${suffix}`,
    QUESTION_ITEM: `question-item${suffix}`,
    PAPERS: `papers${suffix}`,
    PAPER_ITEM: `paper-item${suffix}`,
    CANDIDATES: `candidates${suffix}`,
    CANDIDATE_ITEM: `candidate-item${suffix}`,
    RESULTS: `results${suffix}`,
    SCHEDULES: `schedules${suffix}`,
    SCHEDULE: `schedule${suffix}`,
    IMPORT: `import${suffix}`
};

export function AsyncRequest(action, params, cb)
{
    const req = superagent.post(`${INTERFACE_PREFIX}inserv/${action}`);
    req.withCredentials();
    if (params)
    {
        req.type('application/json');
        req.send(params);
    }
    req.accept('json');
    req.timeout(10000);

    req.end((err, res) =>
    {
        if (err)
        {
            return CallbackBridge(err);
        }

        const { statusCode, text } = res;

        if (statusCode !== 200)
        {
            return CallbackBridge(`Status code ${statusCode}`);
        }

        if (!text)
        {
            return CallbackBridge('Response has not content.');
        }

        let jdat = null;
        try
        {
            jdat = JSON.parse(text);
        }
        catch (e)
        {
            return CallbackBridge('Unable to resolve.');
        }

        if (!CompareType(jdat, 'object') || jdat.status)
        {
            return CallbackBridge(jdat);
        }

        CallbackBridge(null, jdat.data);

        function CallbackBridge(err, dat)
        {
            cb && cb(err, dat);
        }
    });
}

export function GetURIParams(uri)
{
    if (!uri)
    {
        uri = window.location.href;
    }

    let pinstc = {};

    let qidx = uri.indexOf("?");
    if (qidx < 0)
    {
        return pinstc;
    }

    let sidx = uri.indexOf("#");
    let pstr = uri.substring(qidx + 1, sidx < 0 ? uri.length : sidx);
    let kvarr = pstr.split("&");
    for (let i = 0, l = kvarr.length; i < l; ++i)
    {
        let itm = kvarr[i];
        let eidx = itm.indexOf("=");
        if (eidx < 0)
        {
            continue;
        }

        pinstc[itm.substring(0, eidx)] = itm.substring(eidx + 1);
    }

    return pinstc;
}

export function SetURIParams(uri, params, rmd)
{
    let prefix = null;
    let note = null;

    let qidx = uri.indexOf("?");
    let sidx = uri.indexOf("#");
    if (qidx >= 0)
    {
        prefix = uri.substring(0, qidx);
    }
    else if (sidx >= 0)
    {
        prefix = uri.substring(0, sidx);
    }
    else
    {
        prefix = uri;
    }

    if (sidx >= 0)
    {
        note = uri.substring(sidx + 1);
    }

    let pinstc = GetURIParams(uri);

    for (let itm in params)
    {
        if (!params.hasOwnProperty(itm))
        {
            continue;
        }

        pinstc[itm] = params[itm];
    }

    if (rmd)
    {
        for (let i = 0, l = rmd.length; i < l; ++i)
        {
            delete  pinstc[rmd[i]];
        }
    }

    let parr = [];
    for (let itm in pinstc)
    {
        if (!pinstc.hasOwnProperty(itm))
        {
            continue;
        }

        let v = pinstc[itm];
        if (typeof v === "undefined")
        {
            continue;
        }

        if (v === null)
        {
            v = "";
        }
        parr.push(itm + "=" + v);
    }

    let nui = prefix;
    if (parr.length > 0)
    {
        nui += "?" + parr.join("&");
    }

    if (sidx >= 0)
    {
        nui += "#" + note;
    }

    return nui;
}

export function GetType(value)
{
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

export function CompareType(value, type)
{
    return GetType(value) === type.toLowerCase();
}

export function IsUndefined(value)
{
    return CompareType(value, 'undefined');
}
