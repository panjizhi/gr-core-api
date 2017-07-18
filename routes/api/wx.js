const fetch = require('isomorphic-fetch');
const _ = require('lodash');
const keystone = require('keystone');

const Student = keystone.list('Student');
const params = _.reduce({
    appid: 'wx181f65d7992e3bc0',
    secret: '1c0605f060e94c05ea73cb178a91b20d',
    grant_type: 'authorization_code'
}, (result, value, key) => {
    result.push(`${key}=${value}`);
    return result;
}, []).join('&');
const apiUrl = `https://api.weixin.qq.com/sns/jscode2session?${params}`;

/**
 * 微信校验
 */
exports.authority = function (req, res) {
    fetch(`${apiUrl}&js_code=${req.body.code}`)
    .then( response => response.json())
    .then( session => {
        if ( session.openid ) {
            Student.model
            .findOne()
            .where({
                openid: session.openid
            })
            .exec( (err, stu) => {
                if ( !err && stu ) {
                    res.apiResponse(_.reduce(['_id', 'name'], (result, prop) => {
                        result[prop] = stu[prop];
                        return result;
                    }, session));
                } else {
                    res.apiResponse(session);
                }
            });            
        } else {
            res.apiResponse(session);
        }
    });
}

/**
 * 填写真实姓名
 */
exports.addRealName = function (req, res) {
    new Student.model(req.body).save( (err, item) => {
        if ( err ) {
            return res.apiError('database error', err);
        }

        res.apiResponse(item);
    });
}

