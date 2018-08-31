import moment from 'moment';

export function FillCandidates(records, cls)
{
    return records.map(ins =>
    {
        let cns = null;
        if (ins.classes && ins.classes.length)
        {
            cns = [];
            ins.classes.forEach(ins =>
            {
                const v = cls[ins];
                if (v)
                {
                    cns.push(v.name);
                }
            });
        }

        return {
            id: ins._id,
            key: ins._id,
            avatar: ins.avatarUrl,
            name: ins.name,
            classes: cns ? cns.join('，') : '无',
            openid: ins.openid,
            created_time: ins.createTime ? moment(ins.createTime).format('YYYY-MM-DD HH:mm:ss') : '较早之前'
        }
    });
}
