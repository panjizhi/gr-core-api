import superagent from 'superagent';

export const INTERFACE_PREFIX = 'https://dev.gerun.mobi/';

const suffix = '.html';

export const UPLOAD_ADDRESS = `${INTERFACE_PREFIX}open/upload/picture`;

export const DOWNLOAD_ADDRESS = `${INTERFACE_PREFIX}open/download`;

export const DEFAULT_ERR_MESSAGE = '网络繁忙，请稍后再试';

export const DEFAULT_SUCCESS_MESSAGE = '操作成功';

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
    AUTO_SCHEDULES: `auto-schedules${suffix}`,
    AUTO_SCHEDULE_ITEM: `auto-schedule-item${suffix}`,
    CANDIDATE_REPORT: `candidate-report${suffix}`,
    CLASS_REPORT: `class-report${suffix}`,
    IMPORT: `import${suffix}`,
    USERS: `users${suffix}`,
    PERMISSIONS: `permissions${suffix}`,
    OPTIONS: `options${suffix}`
};

export const PERMISSIONS = {
    CREATE_CLASS: 'create_class',
    REMOVE_CLASS: 'remove_class',
    CREATE_SUBJECT: 'create_subject',
    REMOVE_SUBJECT: 'remove_subject',
    QUESTIONS: 'questions',
    REMOVE_QUESTION: 'remove_question',
    PAPERS: 'papers',
    REMOVE_PAPER: 'remove_paper',
    CANDIDATES: 'candidates',
    REMOVE_CANDIDATE: 'remove_candidate',
    RESULTS: 'results',
    SCHEDULES: 'schedules',
    REMOVE_SCHEDULE: 'remove_schedule',
    NEW_SCHEDULE: 'new_schedule',
    AUTO_SCHEDULE: 'auto_schedule',
    CANDIDATE_REPORT: 'candidate_report',
    CLASS_REPORT: 'class_report',
    IMPORT: 'import',
    USERS: 'users',
    PERMISSIONS: 'permissions',
    OPTIONS: 'options'
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

export function ObjectReduce(ins, cb, total)
{
    let result = typeof total === 'undefined' ? 0 : total;
    for (const key in ins)
    {
        if (!ins.hasOwnProperty(key))
        {
            continue;
        }

        const val = ins[key];
        result = cb(result, key, val);
    }

    return result;
}
