import React from 'react';
import { message, Pagination, Tooltip, Icon } from 'antd';
import moment from 'moment';
import { AsyncRequest, DOWNLOAD_ADDRESS, IsUndefined, ROUTES, SetURIParams } from '../../public';
import './index.css';

export default class PaperResults extends React.Component
{
    constructor(props)
    {
        super(props);

        const defaultTime = moment('2000-01-01 00:00:00');
        this.state = {
            default_timestamp: defaultTime.unix(),
            id: props.value,
            current: 0,
            count: 50,
            total: 0
        };
    }

    componentDidMount()
    {
        this.ReadResults();
    }

    componentWillReceiveProps(nextProps)
    {
        if (nextProps.value !== this.state.id)
        {
            this.state.id = nextProps.value;
            this.ReadResults();
        }
    }

    ReadResults(current)
    {
        const { default_timestamp, id, count } = this.state;
        if (!id)
        {
            return;
        }

        if (IsUndefined(current))
        {
            current = 0;
        }

        const pdt = {
            paper: id,
            start: current * count,
            count: count
        };
        AsyncRequest('result/GetMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载成绩出现错误');
            }

            const data = dat.records.map(ins =>
            {
                ins.id = ins._id;
                ins.duration = ins.duration ? moment.unix(default_timestamp + ins.duration).format('HH:mm:ss') : null;
                ins.created_time = ins.created_time ? moment.unix(ins.created_time).format('YYYY-MM-DD HH:mm:ss') : '较早之前';
                return ins;
            });

            this.setState({
                current: current,
                total: dat.total,
                records: data
            });
        });
    }

    onPageChange(page)
    {
        if (page < 1)
        {
            return;
        }

        this.ReadResults(page - 1);
    }

    static onNavigateCandidate(ins)
    {
        window.open(SetURIParams(ROUTES.CANDIDATE_ITEM, {
            q: ins.candidate._id
        }));
    }

    static ExportResult(record)
    {
        const { id } = record;
        window.location.href = SetURIParams(`${DOWNLOAD_ADDRESS}/result`, { id });
    }

    render()
    {
        const { current, count, total, records } = this.state;

        return (
            <div>
                <div className="qpps-container">
                    {
                        records && records.length ? records.map(ins => (
                            <div
                                key={ ins.id }
                                className="qpps-item"
                            >
                                <div
                                    className="prlt-avatar"
                                    onClick={ PaperResults.onNavigateCandidate.bind(this, ins) }
                                >
                                    <img src={ ins.candidate.avatarUrl } />
                                </div>
                                <div>
                                    <div className="prlt-top">
                                        <div>{ ins.candidate.name }</div>
                                        <div>{ ins.duration }</div>
                                        <div className="prlt-score">{ ins.score }</div>
                                    </div>
                                    <div className="prlt-bottom">
                                        <div>{ ins.created_time }</div>
                                    </div>
                                </div>
                                <div className="prlt-action">
                                    <Tooltip title="导出答卷">
                                        <Icon
                                            type="export"
                                            size="small"
                                            onClick={ PaperResults.ExportResult.bind(this, ins) }
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        )) : null
                    }
                </div>
                <div className="qpps-pagination">
                    <Pagination
                        simple
                        current={ current + 1 }
                        pageSize={ count }
                        total={ total }
                        onChange={ this.onPageChange.bind(this) }
                    />
                </div>
            </div>
        )
    }
}
