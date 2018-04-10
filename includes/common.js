const crypto = require('crypto');

module.exports = {
    FloatAdd: (arg1, arg2) =>
    {
        let r1, r2, m;
        try
        {
            let arr = arg1.toString().split('.');
            r1 = arr.length > 1 ? arr[1].length : 0;
        }
        catch (e)
        {
            r1 = 0;
        }
        try
        {
            let arr = arg2.toString().split('.');
            r2 = arr.length > 1 ? arr[1].length : 0;
        }
        catch (e)
        {
            r2 = 0;
        }
        m = Math.pow(10, Math.max(r1, r2));
        return module.exports.FloatDiv(module.exports.FloatMul(arg1, m) + module.exports.FloatMul(arg2, m), m);
    },
    FloatSub: (arg1, arg2) =>
    {
        let r1, r2, m, n;
        try
        {
            let arr = arg1.toString().split('.');
            r1 = arr.length > 1 ? arr[1].length : 0;
        }
        catch (e)
        {
            r1 = 0;
        }
        try
        {
            let arr = arg2.toString().split('.');
            r2 = arr.length > 1 ? arr[1].length : 0;
        }
        catch (e)
        {
            r2 = 0;
        }
        m = Math.pow(10, Math.max(r1, r2));
        //动态控制精度长度
        n = (r1 >= r2) ? r1 : r2;
        return parseFloat(module.exports.FloatDiv((module.exports.FloatMul(arg1, m) - module.exports.FloatMul(arg2, m)), m).toFixed(n));
    },
    FloatMul: (arg1, arg2) =>
    {
        let m = 0, s1 = arg1.toString(), s2 = arg2.toString();
        try
        {
            let arr = s1.split('.');
            m += arr.length > 1 ? arr[1].length : 0;
        }
        catch (e)
        {
        }
        try
        {
            let arr = s2.split('.');
            m += arr.length > 1 ? arr[1].length : 0;
        }
        catch (e)
        {
        }
        return Number(s1.replace('.', '')) * Number(s2.replace('.', '')) / Math.pow(10, m);
    },
    FloatDiv: (arg1, arg2) =>
    {
        let t1 = 0, t2 = 0, r1, r2;
        try
        {
            let arr = arg1.toString().split('.');
            t1 = arr.length > 1 ? arr[1].length : 0;
        }
        catch (e)
        {
        }
        try
        {
            let arr = arg2.toString().split('.');
            t2 = arr.length > 1 ? arr[1].length : 0;
        }
        catch (e)
        {
        }
        with (Math)
        {
            r1 = Number(arg1.toString().replace('.', ''));
            r2 = Number(arg2.toString().replace('.', ''));
            return (r1 / r2) * pow(10, t2 - t1);
        }
    },
    FloatKeepDecimal: (arg1, digit) =>
    {
        let base = Math.pow(10, digit);
        return module.exports.FloatDiv(Math.ceil(module.exports.FloatMul(arg1, base)), base);
    },
    GetURIParams: (uri) =>
    {
        let pinstc = {};

        let qidx = uri.indexOf('?');
        if (qidx < 0)
        {
            return pinstc;
        }

        let sidx = uri.indexOf('#');
        let pstr = uri.substring(qidx + 1, sidx < 0 ? uri.length : sidx);
        let kletr = pstr.split('&');
        for (let i = 0, l = kletr.length; i < l; ++i)
        {
            let itm = kletr[i];
            let eidx = itm.indexOf('=');
            if (eidx < 0)
            {
                continue;
            }

            pinstc[itm.substring(0, eidx)] = itm.substring(eidx + 1);
        }

        return pinstc;
    },
    SetURIParams: (uri, params, rmd) =>
    {
        let prefix = null;
        let note = null;

        let qidx = uri.indexOf('?');
        let sidx = uri.indexOf('#');
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

        let pinstc = module.exports.GetURIParams(uri);

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
            if (typeof v == 'undefined')
            {
                continue;
            }

            if (v == null)
            {
                v = '';
            }
            parr.push(itm + '=' + v);
        }

        let nui = prefix;
        if (parr.length > 0)
        {
            nui += '?' + parr.join('&');
        }

        if (sidx >= 0)
        {
            nui += '#' + note;
        }

        return nui;
    },
    GetType: (value) =>
    {
        return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
    },
    CompareType: (value, type) =>
    {
        return module.exports.GetType(value) === type.toLowerCase();
    },
    IsUndefined: (value) =>
    {
        return module.exports.CompareType(value, 'undefined');
    },
    Extend: (dest, source, skip) =>
    {
        if (!module.exports.CompareType(dest, 'object') || !module.exports.CompareType(source, 'object'))
        {
            return skip && !(typeof dest === 'undefined' || dest === null) ? dest : source;
        }

        for (let key in source)
        {
            if (!source.hasOwnProperty(key))
            {
                continue;
            }

            dest[key] = module.exports.Extend(dest[key], source[key], skip);
        }

        return dest;
    },
    CheckStruct: (struct, contrast, link) =>
    {
        link = link || [];

        if (module.exports.CompareType(contrast, 'string'))
        {
            contrast = {
                type: contrast
            };
        }

        if (contrast.fixed)
        {
            link.push('fixed');

            if (struct !== contrast.fixed)
            {
                return 1;
            }
        }
        else if (contrast.type)
        {
            let exType = contrast.type;

            link.push(exType);

            let valType = module.exports.GetType(struct);
            switch (valType)
            {
                case 'boolean':
                {
                    if (exType !== 'bool')
                    {
                        return 1;
                    }

                    break;
                }
                case 'number':
                {
                    if (struct % 1)
                    {
                        if (exType !== 'double')
                        {
                            return 1;
                        }
                    }
                    else
                    {
                        if (exType !== 'int' && exType !== 'uint' && exType !== 'double')
                        {
                            return 1;
                        }

                        if (exType === 'uint' && struct < 0)
                        {
                            return 1;
                        }
                    }

                    break;
                }
                case 'string':
                {
                    if (exType !== 'string')
                    {
                        return 1;
                    }

                    if (!struct && !contrast.empty)
                    {
                        return 1;
                    }

                    break;
                }
                case 'array':
                {
                    if (exType !== 'array')
                    {
                        return 1;
                    }

                    if (!struct.length && !contrast.empty)
                    {
                        return 1;
                    }

                    let exItem = contrast.item;
                    if (exItem)
                    {
                        for (let i = 0, l = struct.length; i < l; ++i)
                        {
                            link.push(i);

                            if (module.exports.CheckStruct(struct[i], exItem, link))
                            {
                                return 1;
                            }

                            link.length -= 1;
                        }
                    }

                    break;
                }
                case 'object':
                {
                    if (exType !== 'object')
                    {
                        return 1;
                    }

                    let fields = contrast.fields;
                    if (fields)
                    {
                        for (let name in fields)
                        {
                            if (!fields.hasOwnProperty(name))
                            {
                                continue;
                            }

                            let value = fields[name];

                            link.push(name);

                            let prop = struct[name];
                            if (prop !== null && prop !== undefined)
                            {
                                if (module.exports.CheckStruct(prop, value, link))
                                {
                                    return 1;
                                }
                            }
                            else
                            {
                                if (!value.null)
                                {
                                    return 1;
                                }
                            }

                            link.length -= 1;
                        }
                    }
                    else
                    {
                        let exItem = contrast.item;
                        if (exItem)
                        {
                            for (let k in struct)
                            {
                                if (!struct.hasOwnProperty(k))
                                {
                                    continue;
                                }

                                link.push(k);

                                let v = struct[k];
                                if (module.exports.CheckStruct(v, exItem, link))
                                {
                                    return 1;
                                }

                                link.length -= 1;
                            }
                        }
                    }

                    break;
                }
                case 'null':
                case 'undefined':
                {
                    if (!contrast.null)
                    {
                        return 1;
                    }

                    break;
                }
                default:
                    return 1;
            }

            link.length -= 1;
        }
        else
        {
            link.push('null');

            if (!struct && !contrast.null)
            {
                return 1;
            }
        }

        return 0;
    },
    MD5: (str) =>
    {
        return crypto.createHash('md5').update(str).digest('hex');
    },
    ImplodeRecursive: (struct) =>
    {
        let t = module.exports.GetType(struct);
        switch (t)
        {
            case 'null':
            case 'undefined':
                return '';
            case 'bool':
                return struct ? 'true' : 'false';
            case 'string':
                return struct;
            case 'object':
            {
                let karr = [];
                for (let k in struct)
                {
                    if (!struct.hasOwnProperty(k))
                    {
                        continue;
                    }

                    karr.push(k);
                }

                karr.sort();

                let varr = [];
                for (let i = 0, l = karr.length; i < l; ++i)
                {
                    varr.push(struct[karr[i]]);
                }

                return module.exports.ImplodeRecursive(varr);
            }
            case 'array':
            {
                let varr = [];
                for (let i = 0, l = struct.length; i < l; ++i)
                {
                    varr.push(module.exports.ImplodeRecursive(struct[i]));
                }

                return varr.join('');
            }
            default:
                return struct.toString();
        }
    }
};
