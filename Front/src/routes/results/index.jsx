import React from 'react';
import ReactDOM from 'react-dom';
import { Input, LocaleProvider, message, Pagination } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Title from '../../components/title';
import Nav from '../../components/nav';
import ResultTable from '../../components/result-table';
import { AsyncRequest, IsUndefined } from '../../public';
import '../../public/index.css';
import './index.css';

class Results extends React.Component
{
    constructor(props)
    {
        super(props);

        const defaultTime = moment('2000-01-01 00:00:00');
        this.state = {
            default_timestamp: defaultTime.unix(),
            loading: true,
            current: 0,
            count: 50,
            total: 0
        };
    }

    componentDidMount()
    {
        this.DirectReadResults(0, (err, { total, records }) =>
        {
            const rcds = this.FillResults(records);
            this.setState({
                loading: false,
                current: 0,
                total: total,
                records: rcds
            });
        });
    }

    ReadResults(current)
    {
        if (IsUndefined(current))
        {
            current = 0;
        }

        this.setState({
            loading: true
        });

        this.DirectReadResults(current, (err, { total, records }) =>
        {
            const rcds = this.FillResults(records);
            this.setState({
                loading: false,
                current: current,
                total: total,
                records: rcds
            });
        });
    }

    DirectReadResults(current, cb)
    {
        const { name, count } = this.state;
        const pdt = {
            paper_name: name,
            candidate_name: name,
            start: current * count,
            count: count
        };
        AsyncRequest('result/GetMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载成绩出现错误', undefined, () =>
                {
                    this.DirectReadResults(current, cb);
                });
            }

            cb(null, dat);
        });
    }

    FillResults(records)
    {
        const { default_timestamp } = this.state;
        return records.map(ins =>
        {
            return {
                id: ins._id,
                key: ins._id,
                paper: ins.paper._id,
                paper_name: ins.paper.name,
                candidate: ins.candidate._id,
                candidate_name: ins.candidate.name,
                full_score: ins.paper.score,
                score: ins.score,
                duration: ins.duration ? moment.unix(default_timestamp + ins.duration).format('HH:mm:ss') : '无',
                created_time: ins.created_time ? moment.unix(ins.created_time).format('YYYY-MM-DD HH:mm:ss') : '较早之前'
            };
        });
    }

    onSearchChange(e)
    {
        const search = e.target.value;
        this.setState({
            search: search
        });
    }

    onSearchResult(text)
    {
        const value = text || null;
        if (this.state.name !== value)
        {
            this.state.name = value;
            this.ReadResults();
        }
    }

    onPageChange(page)
    {
        if (page < 1)
        {
            return;
        }

        this.ReadResults(page - 1);
    }

    render()
    {
        const { loading, search, records, current, count, total } = this.state;

        return (
            <div>
                <Title />
                <Nav
                    open="candidates"
                    selected="results"
                />
                <div className="content-layout">
                    <div className="content">
                        <div className="qtbl-search">
                            <Input.Search
                                value={ search }
                                placeholder="请输入要搜索的试卷或学生名称"
                                onChange={ this.onSearchChange.bind(this) }
                                onSearch={ this.onSearchResult.bind(this) }
                                style={ {
                                    width: 360
                                } }
                            />
                        </div>
                        <div className="rtbl-table">
                            <ResultTable
                                loading={ loading }
                                value={ records }
                            />
                        </div>
                        <div className="qtbl-footer">
                            <div className="qtbl-pagination">
                                <Pagination
                                    current={ current + 1 }
                                    pageSize={ count }
                                    total={ total }
                                    showTotal={ total => `共计${total}项` }
                                    onChange={ this.onPageChange.bind(this) }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Results /></LocaleProvider>, document.getElementById('root'));
